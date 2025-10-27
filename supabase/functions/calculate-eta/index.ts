import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const mapboxToken = Deno.env.get("MAPBOX_ACCESS_TOKEN");

    // Validate required configuration
    if (!supabaseUrl) {
      console.error("SUPABASE_URL environment variable not configured");
      return new Response(
        JSON.stringify({
          success: false,
          error: "Server configuration error: SUPABASE_URL not set",
          code: "CONFIG_ERROR"
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!supabaseKey) {
      console.error("SUPABASE_SERVICE_ROLE_KEY environment variable not configured");
      return new Response(
        JSON.stringify({
          success: false,
          error: "Server configuration error: Authentication key not set",
          code: "CONFIG_ERROR"
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!mapboxToken) {
      console.error("MAPBOX_ACCESS_TOKEN environment variable not configured");
      return new Response(
        JSON.stringify({
          success: false,
          error: "Server configuration error: Mapbox token not configured",
          code: "CONFIG_ERROR"
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    const requestBody = await req.json();
    const { orderId, courierLat, courierLng } = requestBody;

    // Validate required request parameters
    if (!orderId) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Missing required parameter: orderId",
          code: "INVALID_REQUEST"
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (courierLat === undefined || courierLat === null || courierLng === undefined || courierLng === null) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Missing courier coordinates: courierLat and courierLng required",
          code: "INVALID_REQUEST"
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get order details
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("pickup_lat, pickup_lng, dropoff_lat, dropoff_lng, merchant_id")
      .eq("id", orderId)
      .single();

    if (orderError) {
      console.error("Error fetching order from database:", orderError);
      return new Response(
        JSON.stringify({
          success: false,
          error: `Failed to fetch order: ${orderError.message}`,
          code: "ORDER_FETCH_ERROR"
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!order) {
      return new Response(
        JSON.stringify({
          success: false,
          error: `Order not found with ID: ${orderId}`,
          code: "ORDER_NOT_FOUND"
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate order has required coordinates
    if (!order.pickup_lat || !order.pickup_lng || !order.dropoff_lat || !order.dropoff_lng) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Order is missing pickup or dropoff coordinates",
          code: "MISSING_COORDINATES"
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Build coordinates for route: courier → pickup → dropoff
    const coordinates = [
      `${courierLng},${courierLat}`,
      `${order.pickup_lng},${order.pickup_lat}`,
      `${order.dropoff_lng},${order.dropoff_lat}`
    ].join(";");

    // Call Mapbox Directions API
    const directionsUrl = `https://api.mapbox.com/directions/v5/mapbox/driving/${coordinates}?access_token=${mapboxToken}&geometries=geojson&overview=full`;

    const response = await fetch(directionsUrl);

    if (!response.ok) {
      console.error(`Mapbox API error: ${response.status} ${response.statusText}`);
      const errorData = await response.json().catch(() => ({ message: response.statusText }));
      return new Response(
        JSON.stringify({
          success: false,
          error: `Mapbox API error: ${response.status}`,
          code: "MAPBOX_API_ERROR",
          details: errorData.message || errorData
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();

    if (!data.routes || data.routes.length === 0) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "No route found between coordinates",
          code: "NO_ROUTE_FOUND"
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const route = data.routes[0];
    const durationSeconds = route.duration;
    const distanceMeters = route.distance;
    const etaMinutes = Math.ceil(durationSeconds / 60);
    const distanceMiles = (distanceMeters * 0.000621371).toFixed(2);

    // Update order with ETA
    const { error: updateError } = await supabase
      .from("orders")
      .update({
        eta_minutes: etaMinutes,
        eta_updated_at: new Date().toISOString(),
        distance_miles: parseFloat(distanceMiles)
      })
      .eq("id", orderId);

    if (updateError) {
      console.error("Error updating order with ETA:", updateError);
      return new Response(
        JSON.stringify({
          success: false,
          error: `Failed to update order with ETA: ${updateError.message}`,
          code: "UPDATE_ERROR"
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        eta_minutes: etaMinutes,
        distance_miles: parseFloat(distanceMiles),
        route: route.geometry
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorCode = error instanceof Error && 'code' in error ? (error as any).code : 'UNKNOWN_ERROR';

    console.error("Unexpected error calculating ETA:", {
      message: errorMessage,
      code: errorCode,
      error: error
    });

    return new Response(
      JSON.stringify({
        success: false,
        error: `ETA calculation failed: ${errorMessage}`,
        code: errorCode
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
