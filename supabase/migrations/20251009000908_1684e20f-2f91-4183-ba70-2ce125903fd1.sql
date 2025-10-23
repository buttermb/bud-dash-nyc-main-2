-- Create trigger to auto-create profiles on signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Update existing profile with proper data
UPDATE public.profiles
SET full_name = 'User'
WHERE user_id = '7d03eea3-9460-4f29-a6c2-77f4a3440c09'
  AND full_name IS NULL;