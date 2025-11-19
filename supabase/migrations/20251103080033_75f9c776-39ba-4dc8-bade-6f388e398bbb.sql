-- Create user roles enum
CREATE TYPE public.user_role AS ENUM ('student', 'teacher', 'admin', 'parent');

-- Create app status enum
CREATE TYPE public.assignment_status AS ENUM ('draft', 'planning', 'outlining', 'writing', 'reviewing', 'complete');

-- Create task type enum
CREATE TYPE public.task_type AS ENUM ('essay', 'commentary', 'tok', 'ia', 'ee', 'other');

-- Create subject enum
CREATE TYPE public.subject_type AS ENUM ('lang_a', 'lang_b', 'history', 'economics', 'biology', 'chemistry', 'physics', 'math', 'tok', 'other');

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.user_role NOT NULL DEFAULT 'student',
  full_name TEXT,
  school_name TEXT,
  consent_given BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- Create rubrics table
CREATE TABLE public.rubrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  subject public.subject_type NOT NULL,
  task_type public.task_type NOT NULL,
  criteria JSONB NOT NULL, -- [{id, label, descriptors, weight}]
  created_by UUID REFERENCES public.profiles(id),
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.rubrics ENABLE ROW LEVEL SECURITY;

-- Rubrics policies
CREATE POLICY "Anyone can view rubrics"
  ON public.rubrics FOR SELECT
  USING (true);

CREATE POLICY "Teachers can create rubrics"
  ON public.rubrics FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('teacher', 'admin')
    )
  );

-- Create assignments table
CREATE TABLE public.assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  subject public.subject_type NOT NULL,
  task_type public.task_type NOT NULL,
  rubric_id UUID REFERENCES public.rubrics(id),
  deadline TIMESTAMP WITH TIME ZONE,
  status public.assignment_status NOT NULL DEFAULT 'draft',
  no_ghostwriting_accepted BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;

-- Assignments policies
CREATE POLICY "Users can view their own assignments"
  ON public.assignments FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own assignments"
  ON public.assignments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own assignments"
  ON public.assignments FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own assignments"
  ON public.assignments FOR DELETE
  USING (auth.uid() = user_id);

-- Create plans table (idea builder)
CREATE TABLE public.plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id UUID NOT NULL REFERENCES public.assignments(id) ON DELETE CASCADE,
  thesis TEXT,
  audience TEXT,
  constraints TEXT,
  questions JSONB, -- [{question, answer}]
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage plans for their assignments"
  ON public.plans FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.assignments
      WHERE id = plans.assignment_id AND user_id = auth.uid()
    )
  );

-- Create outlines table
CREATE TABLE public.outlines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id UUID NOT NULL REFERENCES public.assignments(id) ON DELETE CASCADE,
  sections JSONB NOT NULL, -- [{id, title, bullets[], order}]
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.outlines ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage outlines for their assignments"
  ON public.outlines FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.assignments
      WHERE id = outlines.assignment_id AND user_id = auth.uid()
    )
  );

-- Create drafts table
CREATE TABLE public.drafts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id UUID NOT NULL REFERENCES public.assignments(id) ON DELETE CASCADE,
  content TEXT,
  word_count INTEGER DEFAULT 0,
  citations JSONB, -- [{id, text, source}]
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.drafts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage drafts for their assignments"
  ON public.drafts FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.assignments
      WHERE id = drafts.assignment_id AND user_id = auth.uid()
    )
  );

-- Create reviews table
CREATE TABLE public.reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id UUID NOT NULL REFERENCES public.assignments(id) ON DELETE CASCADE,
  rubric_id UUID REFERENCES public.rubrics(id),
  scores JSONB, -- {criterion_id: level}
  feedback JSONB, -- {criterion_id: text}
  actions JSONB, -- [{desc, priority, criterion}]
  overall_summary TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view reviews for their assignments"
  ON public.reviews FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.assignments
      WHERE id = reviews.assignment_id AND user_id = auth.uid()
    )
  );

-- Create coaching sessions table (for audit log)
CREATE TABLE public.coaching_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id UUID NOT NULL REFERENCES public.assignments(id) ON DELETE CASCADE,
  session_type TEXT NOT NULL, -- 'plan', 'outline', 'draft', 'review'
  input_text TEXT,
  output_text TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.coaching_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view coaching sessions for their assignments"
  ON public.coaching_sessions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.assignments
      WHERE id = coaching_sessions.assignment_id AND user_id = auth.uid()
    )
  );

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'full_name', ''),
    COALESCE((new.raw_user_meta_data->>'role')::user_role, 'student')
  );
  RETURN new;
END;
$$;

-- Create trigger for new user
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Add update triggers
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_assignments_updated_at
  BEFORE UPDATE ON public.assignments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_rubrics_updated_at
  BEFORE UPDATE ON public.rubrics
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_plans_updated_at
  BEFORE UPDATE ON public.plans
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_outlines_updated_at
  BEFORE UPDATE ON public.outlines
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_drafts_updated_at
  BEFORE UPDATE ON public.drafts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default IBDP rubric for Language A Essay
INSERT INTO public.rubrics (name, subject, task_type, criteria, is_default) VALUES
('IBDP Language A Essay', 'lang_a', 'essay', 
 '[
   {
     "id": "thesis",
     "label": "Thesis & Focus",
     "weight": 20,
     "descriptors": {
       "1": "No clear thesis or focus",
       "2": "Thesis present but unclear or unfocused",
       "3": "Clear thesis with adequate focus",
       "4": "Strong, focused thesis with clear direction",
       "5": "Exceptional thesis with sophisticated focus and nuance"
     }
   },
   {
     "id": "structure",
     "label": "Structure & Organization",
     "weight": 20,
     "descriptors": {
       "1": "No clear structure; disorganized",
       "2": "Basic structure with some organizational issues",
       "3": "Clear structure with logical organization",
       "4": "Strong structure with effective transitions",
       "5": "Sophisticated structure with seamless flow"
     }
   },
   {
     "id": "analysis",
     "label": "Analysis & Evaluation",
     "weight": 25,
     "descriptors": {
       "1": "Primarily descriptive; little analysis",
       "2": "Some analysis but mostly descriptive",
       "3": "Good analysis with evaluation of ideas",
       "4": "Strong analysis with critical evaluation",
       "5": "Sophisticated analysis with insightful evaluation"
     }
   },
   {
     "id": "evidence",
     "label": "Use of Evidence",
     "weight": 20,
     "descriptors": {
       "1": "Little or no evidence; unsupported claims",
       "2": "Some evidence but inadequate or poorly integrated",
       "3": "Adequate evidence with reasonable integration",
       "4": "Strong evidence well integrated into argument",
       "5": "Excellent evidence with sophisticated integration"
     }
   },
   {
     "id": "language",
     "label": "Language & Style",
     "weight": 10,
     "descriptors": {
       "1": "Unclear language with many errors",
       "2": "Basic language with some clarity issues",
       "3": "Clear language with appropriate style",
       "4": "Effective language with strong style",
       "5": "Sophisticated language with excellent style"
     }
   },
   {
     "id": "citations",
     "label": "Academic Honesty & Citations",
     "weight": 5,
     "descriptors": {
       "1": "No citations or serious plagiarism concerns",
       "2": "Inconsistent citations; some concerns",
       "3": "Adequate citations following format",
       "4": "Strong citations with proper attribution",
       "5": "Excellent citations with perfect adherence"
     }
   }
 ]'::jsonb,
 true
);