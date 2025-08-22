--
-- PostgreSQL database dump
--

-- Dumped from database version 16.9
-- Dumped by pg_dump version 16.9

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: admin_users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.admin_users (
    id integer NOT NULL,
    username text NOT NULL,
    password text NOT NULL,
    email text NOT NULL,
    first_name text NOT NULL,
    last_name text NOT NULL,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT now(),
    last_login_at timestamp without time zone
);


--
-- Name: admin_users_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.admin_users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: admin_users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.admin_users_id_seq OWNED BY public.admin_users.id;


--
-- Name: assessment_schedules; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.assessment_schedules (
    id integer NOT NULL,
    injury_type text NOT NULL,
    assessment_id integer NOT NULL,
    is_required boolean DEFAULT true,
    frequency text DEFAULT 'daily'::text NOT NULL,
    estimated_minutes integer DEFAULT 5,
    day_of_week integer,
    is_active boolean DEFAULT true
);


--
-- Name: assessment_schedules_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.assessment_schedules_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: assessment_schedules_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.assessment_schedules_id_seq OWNED BY public.assessment_schedules.id;


--
-- Name: assessment_types; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.assessment_types (
    id integer NOT NULL,
    name text NOT NULL,
    description text NOT NULL,
    instructions text,
    video_url text,
    duration integer NOT NULL,
    repetitions integer DEFAULT 3,
    is_active boolean DEFAULT true,
    order_index integer NOT NULL
);


--
-- Name: assessment_types_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.assessment_types_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: assessment_types_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.assessment_types_id_seq OWNED BY public.assessment_types.id;


--
-- Name: assessments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.assessments (
    id integer NOT NULL,
    name text NOT NULL,
    description text NOT NULL,
    video_url text,
    duration integer NOT NULL,
    repetitions integer DEFAULT 3,
    instructions text,
    is_active boolean DEFAULT true,
    order_index integer NOT NULL
);


--
-- Name: assessments_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.assessments_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: assessments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.assessments_id_seq OWNED BY public.assessments.id;


--
-- Name: audit_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.audit_logs (
    id integer NOT NULL,
    user_id integer NOT NULL,
    action text NOT NULL,
    target_entity text,
    details jsonb,
    ip_address text,
    user_agent text,
    "timestamp" timestamp without time zone DEFAULT now()
);


--
-- Name: audit_logs_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.audit_logs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: audit_logs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.audit_logs_id_seq OWNED BY public.audit_logs.id;


--
-- Name: clinical_users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.clinical_users (
    id integer NOT NULL,
    username text NOT NULL,
    password text NOT NULL,
    email text NOT NULL,
    first_name text NOT NULL,
    last_name text NOT NULL,
    role text NOT NULL,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT now(),
    last_login_at timestamp without time zone
);


--
-- Name: clinical_users_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.clinical_users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: clinical_users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.clinical_users_id_seq OWNED BY public.clinical_users.id;


--
-- Name: cohorts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.cohorts (
    id integer NOT NULL,
    name text NOT NULL,
    description text NOT NULL,
    normal_rom_ranges jsonb,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: cohorts_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.cohorts_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: cohorts_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.cohorts_id_seq OWNED BY public.cohorts.id;


--
-- Name: daily_completions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.daily_completions (
    id integer NOT NULL,
    user_id integer NOT NULL,
    completion_date date NOT NULL,
    assessments_completed integer DEFAULT 0 NOT NULL,
    total_assessments integer DEFAULT 0 NOT NULL,
    streak_day integer DEFAULT 1,
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: daily_completions_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.daily_completions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: daily_completions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.daily_completions_id_seq OWNED BY public.daily_completions.id;


--
-- Name: data_exports; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.data_exports (
    id integer NOT NULL,
    requested_by integer NOT NULL,
    export_type text NOT NULL,
    filters jsonb,
    download_url text,
    expires_at timestamp without time zone,
    downloaded_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: data_exports_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.data_exports_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: data_exports_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.data_exports_id_seq OWNED BY public.data_exports.id;


--
-- Name: injury_types; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.injury_types (
    id integer NOT NULL,
    name text NOT NULL,
    description text NOT NULL,
    icon text NOT NULL
);


--
-- Name: injury_types_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.injury_types_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: injury_types_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.injury_types_id_seq OWNED BY public.injury_types.id;


--
-- Name: outlier_alerts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.outlier_alerts (
    id integer NOT NULL,
    patient_id integer NOT NULL,
    cohort_id integer NOT NULL,
    alert_type text NOT NULL,
    severity text NOT NULL,
    metric text NOT NULL,
    deviation_value numeric(5,2),
    consecutive_occurrences integer DEFAULT 1,
    is_resolved boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT now(),
    resolved_at timestamp without time zone
);


--
-- Name: outlier_alerts_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.outlier_alerts_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: outlier_alerts_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.outlier_alerts_id_seq OWNED BY public.outlier_alerts.id;


--
-- Name: patient_assessments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.patient_assessments (
    id integer NOT NULL,
    patient_id integer NOT NULL,
    assessment_type_id integer NOT NULL,
    clinician_id integer NOT NULL,
    assessment_date timestamp without time zone DEFAULT now(),
    session_number integer DEFAULT 1,
    device_confidence_score numeric(5,2),
    tam_score numeric(5,2),
    index_finger_rom numeric(5,2),
    middle_finger_rom numeric(5,2),
    ring_finger_rom numeric(5,2),
    pinky_finger_rom numeric(5,2),
    index_mcp numeric(5,2),
    index_pip numeric(5,2),
    index_dip numeric(5,2),
    middle_mcp numeric(5,2),
    middle_pip numeric(5,2),
    middle_dip numeric(5,2),
    ring_mcp numeric(5,2),
    ring_pip numeric(5,2),
    ring_dip numeric(5,2),
    pinky_mcp numeric(5,2),
    pinky_pip numeric(5,2),
    pinky_dip numeric(5,2),
    kapandji_score numeric(5,2),
    wrist_flexion_angle numeric(5,2),
    wrist_extension_angle numeric(5,2),
    max_wrist_flexion numeric(5,2),
    max_wrist_extension numeric(5,2),
    percent_of_normal_rom numeric(5,2),
    change_from_baseline numeric(5,2),
    raw_data jsonb,
    notes text,
    post_op_day integer,
    study_week integer,
    vas_score integer,
    quick_dash_score numeric(5,2),
    missed_visit boolean DEFAULT false,
    retake_flag boolean DEFAULT false,
    is_completed boolean DEFAULT false,
    completed_at timestamp without time zone
);


--
-- Name: patient_assessments_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.patient_assessments_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: patient_assessments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.patient_assessments_id_seq OWNED BY public.patient_assessments.id;


--
-- Name: patients; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.patients (
    id integer NOT NULL,
    patient_id text NOT NULL,
    alias text NOT NULL,
    cohort_id integer,
    assigned_clinician_id integer,
    status text DEFAULT 'stable'::text NOT NULL,
    age_group text,
    sex text,
    hand_dominance text,
    occupation_category text,
    surgery_date timestamp without time zone,
    procedure_code text,
    laterality text,
    surgeon_id text,
    injury_type text,
    enrollment_status text DEFAULT 'screening'::text,
    enrolled_date timestamp without time zone,
    access_code text,
    phone text,
    date_of_birth date,
    gender text,
    injury_date date,
    eligibility_notes text,
    is_active boolean DEFAULT true,
    baseline_assessment_id integer,
    enrolled_in_study boolean DEFAULT false,
    study_enrollment_date timestamp without time zone,
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: patients_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.patients_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: patients_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.patients_id_seq OWNED BY public.patients.id;


--
-- Name: quick_dash_responses; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.quick_dash_responses (
    id integer NOT NULL,
    patient_id integer NOT NULL,
    assessment_id integer,
    post_op_day integer NOT NULL,
    study_week integer NOT NULL,
    q1_difficulty_opening_jar integer,
    q2_difficulty_writing integer,
    q3_difficulty_turning_key integer,
    q4_difficulty_preparing_meal integer,
    q5_difficulty_pushing_door integer,
    q6_difficulty_placing_object integer,
    q7_arm_shoulder_hand_pain integer,
    q8_arm_shoulder_hand_pain_activity integer,
    q9_tingling_arm_shoulder_hand integer,
    q10_weakness_arm_shoulder_hand integer,
    q11_stiffness_arm_shoulder_hand integer,
    total_score numeric(5,2),
    completed_at timestamp without time zone DEFAULT now()
);


--
-- Name: quick_dash_responses_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.quick_dash_responses_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: quick_dash_responses_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.quick_dash_responses_id_seq OWNED BY public.quick_dash_responses.id;


--
-- Name: study_visits; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.study_visits (
    id integer NOT NULL,
    patient_id integer NOT NULL,
    scheduled_week integer NOT NULL,
    scheduled_date timestamp without time zone NOT NULL,
    window_start timestamp without time zone NOT NULL,
    window_end timestamp without time zone NOT NULL,
    visit_status text DEFAULT 'scheduled'::text NOT NULL,
    completed_at timestamp without time zone,
    assessment_id integer,
    reminder_sent boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: study_visits_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.study_visits_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: study_visits_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.study_visits_id_seq OWNED BY public.study_visits.id;


--
-- Name: user_assessments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_assessments (
    id integer NOT NULL,
    user_id integer NOT NULL,
    assessment_id integer NOT NULL,
    session_number integer DEFAULT 1,
    is_completed boolean DEFAULT false,
    completed_at timestamp without time zone,
    rom_data jsonb,
    repetition_data jsonb,
    quality_score integer,
    max_mcp_angle numeric(5,2),
    max_pip_angle numeric(5,2),
    max_dip_angle numeric(5,2),
    total_active_rom numeric(5,2),
    index_finger_rom numeric(5,2),
    middle_finger_rom numeric(5,2),
    ring_finger_rom numeric(5,2),
    pinky_finger_rom numeric(5,2),
    middle_finger_mcp numeric(5,2),
    middle_finger_pip numeric(5,2),
    middle_finger_dip numeric(5,2),
    ring_finger_mcp numeric(5,2),
    ring_finger_pip numeric(5,2),
    ring_finger_dip numeric(5,2),
    pinky_finger_mcp numeric(5,2),
    pinky_finger_pip numeric(5,2),
    pinky_finger_dip numeric(5,2),
    hand_type text,
    wrist_flexion_angle numeric(5,2),
    wrist_extension_angle numeric(5,2),
    max_wrist_flexion numeric(5,2),
    max_wrist_extension numeric(5,2),
    dash_score numeric(5,2),
    share_token text,
    responses jsonb
);


--
-- Name: user_assessments_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.user_assessments_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: user_assessments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.user_assessments_id_seq OWNED BY public.user_assessments.id;


--
-- Name: user_streaks; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_streaks (
    id integer NOT NULL,
    user_id integer NOT NULL,
    current_streak integer DEFAULT 0,
    longest_streak integer DEFAULT 0,
    total_completions integer DEFAULT 0,
    last_completion_date date,
    last_streak_update timestamp without time zone DEFAULT now()
);


--
-- Name: user_streaks_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.user_streaks_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: user_streaks_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.user_streaks_id_seq OWNED BY public.user_streaks.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.users (
    id integer NOT NULL,
    code text NOT NULL,
    injury_type text,
    first_name text,
    last_name text,
    email text,
    created_at timestamp without time zone DEFAULT now(),
    is_first_time boolean DEFAULT true,
    is_active boolean DEFAULT true,
    surgery_date date
);


--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: admin_users id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.admin_users ALTER COLUMN id SET DEFAULT nextval('public.admin_users_id_seq'::regclass);


--
-- Name: assessment_schedules id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.assessment_schedules ALTER COLUMN id SET DEFAULT nextval('public.assessment_schedules_id_seq'::regclass);


--
-- Name: assessment_types id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.assessment_types ALTER COLUMN id SET DEFAULT nextval('public.assessment_types_id_seq'::regclass);


--
-- Name: assessments id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.assessments ALTER COLUMN id SET DEFAULT nextval('public.assessments_id_seq'::regclass);


--
-- Name: audit_logs id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.audit_logs ALTER COLUMN id SET DEFAULT nextval('public.audit_logs_id_seq'::regclass);


--
-- Name: clinical_users id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.clinical_users ALTER COLUMN id SET DEFAULT nextval('public.clinical_users_id_seq'::regclass);


--
-- Name: cohorts id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cohorts ALTER COLUMN id SET DEFAULT nextval('public.cohorts_id_seq'::regclass);


--
-- Name: daily_completions id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.daily_completions ALTER COLUMN id SET DEFAULT nextval('public.daily_completions_id_seq'::regclass);


--
-- Name: data_exports id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.data_exports ALTER COLUMN id SET DEFAULT nextval('public.data_exports_id_seq'::regclass);


--
-- Name: injury_types id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.injury_types ALTER COLUMN id SET DEFAULT nextval('public.injury_types_id_seq'::regclass);


--
-- Name: outlier_alerts id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.outlier_alerts ALTER COLUMN id SET DEFAULT nextval('public.outlier_alerts_id_seq'::regclass);


--
-- Name: patient_assessments id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.patient_assessments ALTER COLUMN id SET DEFAULT nextval('public.patient_assessments_id_seq'::regclass);


--
-- Name: patients id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.patients ALTER COLUMN id SET DEFAULT nextval('public.patients_id_seq'::regclass);


--
-- Name: quick_dash_responses id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.quick_dash_responses ALTER COLUMN id SET DEFAULT nextval('public.quick_dash_responses_id_seq'::regclass);


--
-- Name: study_visits id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.study_visits ALTER COLUMN id SET DEFAULT nextval('public.study_visits_id_seq'::regclass);


--
-- Name: user_assessments id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_assessments ALTER COLUMN id SET DEFAULT nextval('public.user_assessments_id_seq'::regclass);


--
-- Name: user_streaks id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_streaks ALTER COLUMN id SET DEFAULT nextval('public.user_streaks_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Name: admin_users admin_users_email_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.admin_users
    ADD CONSTRAINT admin_users_email_unique UNIQUE (email);


--
-- Name: admin_users admin_users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.admin_users
    ADD CONSTRAINT admin_users_pkey PRIMARY KEY (id);


--
-- Name: admin_users admin_users_username_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.admin_users
    ADD CONSTRAINT admin_users_username_unique UNIQUE (username);


--
-- Name: assessment_schedules assessment_schedules_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.assessment_schedules
    ADD CONSTRAINT assessment_schedules_pkey PRIMARY KEY (id);


--
-- Name: assessment_types assessment_types_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.assessment_types
    ADD CONSTRAINT assessment_types_pkey PRIMARY KEY (id);


--
-- Name: assessments assessments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.assessments
    ADD CONSTRAINT assessments_pkey PRIMARY KEY (id);


--
-- Name: audit_logs audit_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_pkey PRIMARY KEY (id);


--
-- Name: clinical_users clinical_users_email_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.clinical_users
    ADD CONSTRAINT clinical_users_email_unique UNIQUE (email);


--
-- Name: clinical_users clinical_users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.clinical_users
    ADD CONSTRAINT clinical_users_pkey PRIMARY KEY (id);


--
-- Name: clinical_users clinical_users_username_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.clinical_users
    ADD CONSTRAINT clinical_users_username_unique UNIQUE (username);


--
-- Name: cohorts cohorts_name_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cohorts
    ADD CONSTRAINT cohorts_name_unique UNIQUE (name);


--
-- Name: cohorts cohorts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cohorts
    ADD CONSTRAINT cohorts_pkey PRIMARY KEY (id);


--
-- Name: daily_completions daily_completions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.daily_completions
    ADD CONSTRAINT daily_completions_pkey PRIMARY KEY (id);


--
-- Name: data_exports data_exports_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.data_exports
    ADD CONSTRAINT data_exports_pkey PRIMARY KEY (id);


--
-- Name: injury_types injury_types_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.injury_types
    ADD CONSTRAINT injury_types_pkey PRIMARY KEY (id);


--
-- Name: outlier_alerts outlier_alerts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.outlier_alerts
    ADD CONSTRAINT outlier_alerts_pkey PRIMARY KEY (id);


--
-- Name: patient_assessments patient_assessments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.patient_assessments
    ADD CONSTRAINT patient_assessments_pkey PRIMARY KEY (id);


--
-- Name: patients patients_access_code_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.patients
    ADD CONSTRAINT patients_access_code_unique UNIQUE (access_code);


--
-- Name: patients patients_patient_id_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.patients
    ADD CONSTRAINT patients_patient_id_unique UNIQUE (patient_id);


--
-- Name: patients patients_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.patients
    ADD CONSTRAINT patients_pkey PRIMARY KEY (id);


--
-- Name: quick_dash_responses quick_dash_responses_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.quick_dash_responses
    ADD CONSTRAINT quick_dash_responses_pkey PRIMARY KEY (id);


--
-- Name: study_visits study_visits_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.study_visits
    ADD CONSTRAINT study_visits_pkey PRIMARY KEY (id);


--
-- Name: user_assessments user_assessments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_assessments
    ADD CONSTRAINT user_assessments_pkey PRIMARY KEY (id);


--
-- Name: user_assessments user_assessments_share_token_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_assessments
    ADD CONSTRAINT user_assessments_share_token_unique UNIQUE (share_token);


--
-- Name: user_streaks user_streaks_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_streaks
    ADD CONSTRAINT user_streaks_pkey PRIMARY KEY (id);


--
-- Name: user_streaks user_streaks_user_id_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_streaks
    ADD CONSTRAINT user_streaks_user_id_unique UNIQUE (user_id);


--
-- Name: users users_code_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_code_unique UNIQUE (code);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: assessment_schedules assessment_schedules_assessment_id_assessment_types_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.assessment_schedules
    ADD CONSTRAINT assessment_schedules_assessment_id_assessment_types_id_fk FOREIGN KEY (assessment_id) REFERENCES public.assessment_types(id);


--
-- Name: audit_logs audit_logs_user_id_clinical_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_user_id_clinical_users_id_fk FOREIGN KEY (user_id) REFERENCES public.clinical_users(id);


--
-- Name: data_exports data_exports_requested_by_clinical_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.data_exports
    ADD CONSTRAINT data_exports_requested_by_clinical_users_id_fk FOREIGN KEY (requested_by) REFERENCES public.clinical_users(id);


--
-- Name: outlier_alerts outlier_alerts_cohort_id_cohorts_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.outlier_alerts
    ADD CONSTRAINT outlier_alerts_cohort_id_cohorts_id_fk FOREIGN KEY (cohort_id) REFERENCES public.cohorts(id);


--
-- Name: outlier_alerts outlier_alerts_patient_id_patients_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.outlier_alerts
    ADD CONSTRAINT outlier_alerts_patient_id_patients_id_fk FOREIGN KEY (patient_id) REFERENCES public.patients(id);


--
-- Name: patient_assessments patient_assessments_assessment_type_id_assessment_types_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.patient_assessments
    ADD CONSTRAINT patient_assessments_assessment_type_id_assessment_types_id_fk FOREIGN KEY (assessment_type_id) REFERENCES public.assessment_types(id);


--
-- Name: patient_assessments patient_assessments_clinician_id_clinical_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.patient_assessments
    ADD CONSTRAINT patient_assessments_clinician_id_clinical_users_id_fk FOREIGN KEY (clinician_id) REFERENCES public.clinical_users(id);


--
-- Name: patient_assessments patient_assessments_patient_id_patients_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.patient_assessments
    ADD CONSTRAINT patient_assessments_patient_id_patients_id_fk FOREIGN KEY (patient_id) REFERENCES public.patients(id);


--
-- Name: patients patients_assigned_clinician_id_clinical_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.patients
    ADD CONSTRAINT patients_assigned_clinician_id_clinical_users_id_fk FOREIGN KEY (assigned_clinician_id) REFERENCES public.clinical_users(id);


--
-- Name: patients patients_cohort_id_cohorts_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.patients
    ADD CONSTRAINT patients_cohort_id_cohorts_id_fk FOREIGN KEY (cohort_id) REFERENCES public.cohorts(id);


--
-- Name: quick_dash_responses quick_dash_responses_assessment_id_patient_assessments_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.quick_dash_responses
    ADD CONSTRAINT quick_dash_responses_assessment_id_patient_assessments_id_fk FOREIGN KEY (assessment_id) REFERENCES public.patient_assessments(id);


--
-- Name: quick_dash_responses quick_dash_responses_patient_id_patients_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.quick_dash_responses
    ADD CONSTRAINT quick_dash_responses_patient_id_patients_id_fk FOREIGN KEY (patient_id) REFERENCES public.patients(id);


--
-- Name: study_visits study_visits_assessment_id_patient_assessments_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.study_visits
    ADD CONSTRAINT study_visits_assessment_id_patient_assessments_id_fk FOREIGN KEY (assessment_id) REFERENCES public.patient_assessments(id);


--
-- Name: study_visits study_visits_patient_id_patients_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.study_visits
    ADD CONSTRAINT study_visits_patient_id_patients_id_fk FOREIGN KEY (patient_id) REFERENCES public.patients(id);


--
-- PostgreSQL database dump complete
--

