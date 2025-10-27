import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface OrderRequest {
  userId?: string
  merchantId?: string
  deliveryAddress: string
  deliveryBorough: string
  paymentMethod: string
  deliveryFee: number
  subtotal: number
  totalAmount: number
  scheduledDeliveryTime?: string
  deliveryNotes?: string
  pickupLat?: number
  pickupLng?: number
  dropoffLat?: number
  dropoffLng?: number
  customerName?: string
  customerPhone?: string
  customerEmail?: string
  cartItems: Array<{
    productId: string
    quantity: number
    price: number
    productName: string
    selectedWeight: string
  }>
}

Deno.serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');
    const authHeader = req.headers.get('Authorization');

    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('Missing Supabase environment variables');
      throw new Error('Service configuration error');
    }

    const supabaseClient = createClient(
      supabaseUrl,
      supabaseAnonKey,
      {
        global: {
          headers: authHeader ? { Authorization: authHeader } : {},
        },
      }
    )

    let orderData: OrderRequest;
    try {
      orderData = await req.json();
    } catch (parseError) {
      console.error('Failed to parse request body:', parseError);
      throw new Error('Invalid request format');
    }
    console.log('Creating order:', { 
      userId: orderData.userId, 
      itemCount: orderData.cartItems.length,
      total: orderData.totalAmount 
    })

    // Validate required fields
    if (!orderData.deliveryAddress || !orderData.deliveryBorough) {
      throw new Error('Delivery address and borough are required')
    }

    if (orderData.cartItems.length === 0) {
      throw new Error('Cart is empty')
    }

    // Validate contact information
    console.log('Validating contact info:', {
      isGuest: !orderData.userId,
      hasEmail: !!orderData.customerEmail,
      hasPhone: !!orderData.customerPhone,
      customerName: orderData.customerName
    })

    // Email is required for all orders
    if (!orderData.customerEmail || !orderData.customerEmail.trim()) {
      throw new Error('Email address is required')
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(orderData.customerEmail.trim())) {
      throw new Error('Invalid email address format')
    }

    // Phone is required for guest orders
    if (!orderData.userId) {
      if (!orderData.customerPhone || !orderData.customerPhone.trim()) {
        throw new Error('Phone number is required')
      }

      // Basic phone validation (at least 10 digits)
      const phoneDigits = orderData.customerPhone.replace(/\D/g, '')
      if (phoneDigits.length < 10) {
        throw new Error('Phone number must contain at least 10 digits')
      }
    }

    console.log('Contact info validated successfully')

    // Get merchant location data if not provided
    if (!orderData.pickupLat || !orderData.pickupLng) {
      const { data: product, error: productError } = await supabaseClient
        .from('products')
        .select('merchant_id, merchants(id, latitude, longitude)')
        .eq('id', orderData.cartItems[0].productId)
        .maybeSingle()

      if (productError) {
        console.error('Error fetching merchant:', productError)
      } else if (product?.merchants) {
        const merchant = Array.isArray(product.merchants) ? product.merchants[0] : product.merchants
        orderData.pickupLat = merchant?.latitude
        orderData.pickupLng = merchant?.longitude
        orderData.merchantId = merchant?.id
      }
    }

    // Generate unique tracking code
    const trackingCode = `NYM${Date.now().toString().slice(-6)}${Math.random().toString(36).substring(2, 8).toUpperCase()}`

    // Create order
    const orderPayload = {
      user_id: orderData.userId || null,
      merchant_id: orderData.merchantId || null,
      delivery_address: orderData.deliveryAddress,
      delivery_borough: orderData.deliveryBorough,
      payment_method: orderData.paymentMethod,
      delivery_fee: orderData.deliveryFee,
      subtotal: orderData.subtotal,
      total_amount: orderData.totalAmount,
      scheduled_delivery_time: orderData.scheduledDeliveryTime || null,
      delivery_notes: orderData.deliveryNotes || null,
      status: 'pending',
      tracking_code: trackingCode,
      pickup_lat: orderData.pickupLat || null,
      pickup_lng: orderData.pickupLng || null,
      dropoff_lat: orderData.dropoffLat || null,
      dropoff_lng: orderData.dropoffLng || null,
      customer_name: orderData.customerName || null,
      customer_phone: orderData.customerPhone || null,
      customer_email: orderData.customerEmail || null,
    }

    console.log('Inserting order with payload:', {
      ...orderPayload,
      user_id: orderPayload.user_id ? 'set' : 'null'
    })

    const { data: order, error: orderError } = await supabaseClient
      .from('orders')
      .insert(orderPayload)
      .select()
      .single()

    if (orderError) {
      console.error('Order creation error:', {
        message: orderError.message,
        code: orderError.code,
        details: orderError.details,
        hint: orderError.hint,
        status: orderError.status
      })

      // Provide better error messages based on the error type
      if (orderError.code === '23505') {
        throw new Error('Order record already exists')
      } else if (orderError.code === '23502') {
        throw new Error('Missing required field in order data')
      } else if (orderError.message?.includes('customer_email')) {
        throw new Error('Email address validation failed')
      } else if (orderError.message?.includes('customer_phone')) {
        throw new Error('Phone number validation failed')
      } else {
        throw new Error(`Failed to create order: ${orderError.message}`)
      }
    }

    console.log('Order created:', order.id)

    // Insert order items in bulk
    const orderItems = orderData.cartItems.map(item => ({
      order_id: order.id,
      product_id: item.productId,
      quantity: item.quantity,
      price: item.price,
    }))

    console.log('Inserting order items:', { orderId: order.id, itemCount: orderItems.length })

    const { data: insertedItems, error: itemsError } = await supabaseClient
      .from('order_items')
      .insert(orderItems)
      .select()

    if (itemsError) {
      console.error('Order items error:', {
        message: itemsError.message,
        code: itemsError.code,
        details: itemsError.details,
        hint: itemsError.hint
      })
      // Still return success since order was created, but log the error
      console.warn('Order items insertion failed for order:', order.id, '- customer will need to contact support')
    } else {
      console.log('Order items inserted successfully:', { count: insertedItems?.length || 0 })
    }

    // Clear cart in background (non-blocking)
    if (orderData.userId) {
      supabaseClient
        .from('cart_items')
        .delete()
        .eq('user_id', orderData.userId)
        .then(({ error }) => {
          if (error) console.error('Failed to clear cart:', error)
        })
    }

    console.log('Order completed successfully:', { orderId: order.id })

    return new Response(
      JSON.stringify({
        success: true,
        orderId: order.id,
        trackingCode: order.tracking_code || null,
        message: 'Order placed successfully'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    const errorStack = error instanceof Error ? error.stack : undefined

    console.error('Order creation failed:', {
      message: errorMessage,
      stack: errorStack
    })

    // Provide appropriate error response
    const clientMessage = errorMessage.includes('relation') || errorMessage.includes('column')
      ? 'Order service temporarily unavailable. Please try again.'
      : errorMessage

    // Always return 400 for user-facing errors (not 500)
    return new Response(
      JSON.stringify({
        success: false,
        error: clientMessage,
        code: 'ORDER_CREATION_FAILED'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      }
    )
  }
})
