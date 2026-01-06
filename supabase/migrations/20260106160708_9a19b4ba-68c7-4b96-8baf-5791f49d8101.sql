-- Create roles enum
CREATE TYPE public.app_role AS ENUM ('student', 'faculty', 'club_member', 'admin');

-- Create user_roles table
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL DEFAULT 'student',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Create profiles table
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    full_name TEXT,
    department TEXT,
    roll_number TEXT,
    faculty_id TEXT,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create circulars table
CREATE TABLE public.circulars (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    content TEXT,
    department TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'general',
    attachment_url TEXT,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on circulars
ALTER TABLE public.circulars ENABLE ROW LEVEL SECURITY;

-- Create events table
CREATE TABLE public.events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    club_name TEXT NOT NULL,
    event_date DATE NOT NULL,
    event_time TIME NOT NULL,
    venue TEXT NOT NULL,
    poster_url TEXT,
    max_participants INTEGER,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on events
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

-- Create event_registrations table
CREATE TABLE public.event_registrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID REFERENCES public.events(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    registered_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (event_id, user_id)
);

-- Enable RLS on event_registrations
ALTER TABLE public.event_registrations ENABLE ROW LEVEL SECURITY;

-- Create webinars table
CREATE TABLE public.webinars (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    webinar_date DATE NOT NULL,
    webinar_time TIME NOT NULL,
    meeting_link TEXT NOT NULL,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    faculty_name TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on webinars
ALTER TABLE public.webinars ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_roles
CREATE POLICY "Users can view their own roles"
ON public.user_roles FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all roles"
ON public.user_roles FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for profiles
CREATE POLICY "Users can view all profiles"
ON public.profiles FOR SELECT TO authenticated
USING (true);

CREATE POLICY "Users can update their own profile"
ON public.profiles FOR UPDATE TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile"
ON public.profiles FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

-- RLS Policies for circulars
CREATE POLICY "Anyone can view circulars"
ON public.circulars FOR SELECT TO authenticated
USING (true);

CREATE POLICY "Faculty and admin can create circulars"
ON public.circulars FOR INSERT TO authenticated
WITH CHECK (
    public.has_role(auth.uid(), 'faculty') OR 
    public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "Creators can update their circulars"
ON public.circulars FOR UPDATE TO authenticated
USING (auth.uid() = created_by);

CREATE POLICY "Creators and admin can delete circulars"
ON public.circulars FOR DELETE TO authenticated
USING (auth.uid() = created_by OR public.has_role(auth.uid(), 'admin'));

-- RLS Policies for events
CREATE POLICY "Anyone can view events"
ON public.events FOR SELECT TO authenticated
USING (true);

CREATE POLICY "Club members and admin can create events"
ON public.events FOR INSERT TO authenticated
WITH CHECK (
    public.has_role(auth.uid(), 'club_member') OR 
    public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "Creators can update their events"
ON public.events FOR UPDATE TO authenticated
USING (auth.uid() = created_by);

CREATE POLICY "Creators and admin can delete events"
ON public.events FOR DELETE TO authenticated
USING (auth.uid() = created_by OR public.has_role(auth.uid(), 'admin'));

-- RLS Policies for event_registrations
CREATE POLICY "Users can view their registrations"
ON public.event_registrations FOR SELECT TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Event creators can view all registrations"
ON public.event_registrations FOR SELECT TO authenticated
USING (EXISTS (
    SELECT 1 FROM public.events e WHERE e.id = event_id AND e.created_by = auth.uid()
));

CREATE POLICY "Users can register for events"
ON public.event_registrations FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unregister from events"
ON public.event_registrations FOR DELETE TO authenticated
USING (auth.uid() = user_id);

-- RLS Policies for webinars
CREATE POLICY "Anyone can view webinars"
ON public.webinars FOR SELECT TO authenticated
USING (true);

CREATE POLICY "Faculty and admin can create webinars"
ON public.webinars FOR INSERT TO authenticated
WITH CHECK (
    public.has_role(auth.uid(), 'faculty') OR 
    public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "Creators can update their webinars"
ON public.webinars FOR UPDATE TO authenticated
USING (auth.uid() = created_by);

CREATE POLICY "Creators and admin can delete webinars"
ON public.webinars FOR DELETE TO authenticated
USING (auth.uid() = created_by OR public.has_role(auth.uid(), 'admin'));

-- Trigger to create profile and assign default role on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.profiles (user_id, full_name)
    VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name');
    
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, COALESCE((NEW.raw_user_meta_data->>'role')::app_role, 'student'));
    
    RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_circulars_updated_at BEFORE UPDATE ON public.circulars FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON public.events FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_webinars_updated_at BEFORE UPDATE ON public.webinars FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();