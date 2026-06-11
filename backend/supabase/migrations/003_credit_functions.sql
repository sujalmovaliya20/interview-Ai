-- Create RPC for credit deduction
CREATE OR REPLACE FUNCTION deduct_credit(p_user_id UUID, p_amount NUMERIC)
RETURNS NUMERIC
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_balance NUMERIC;
    v_is_unlimited BOOLEAN;
BEGIN
    -- Get current balance and unlimited status
    SELECT balance, is_unlimited 
    INTO v_balance, v_is_unlimited
    FROM credits 
    WHERE user_id = p_user_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Credits record not found for user';
    END IF;

    -- If unlimited, do nothing and return current balance
    IF v_is_unlimited THEN
        RETURN v_balance;
    END IF;

    -- Check if sufficient balance
    IF v_balance < p_amount THEN
        RAISE EXCEPTION 'INSUFFICIENT_CREDITS';
    END IF;

    -- Deduct and return new balance
    UPDATE credits
    SET balance = balance - p_amount,
        updated_at = NOW()
    WHERE user_id = p_user_id
    RETURNING balance INTO v_balance;

    RETURN v_balance;
END;
$$;

-- Create RPC for incrementing questions answered (if needed later)
CREATE OR REPLACE FUNCTION increment_questions_answered(p_session_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE sessions
    SET questions_answered = COALESCE(questions_answered, 0) + 1
    WHERE id = p_session_id;
END;
$$;
