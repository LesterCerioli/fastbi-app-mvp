CREATE TABLE public.stripe_payment_tokens(
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    deleted_at timestamp with time zone,
    stripe_token_id varchar(255) NOT NULL,
    status varchar(50) DEFAULT 'pending'::character varying,
    used_at timestamp with time zone,
    stripe_payment_intent_id varchar(255) ,
    PRIMARY KEY(id) 
); 
CREATE INDEX idx_stripe_payment_tokens_deleted_at ON public.stripe_payment_tokens USING btree (deleted_at);
CREATE INDEX idx_stripe_payment_tokens_status ON public.stripe_payment_tokens USING btree (status);