-- Enable email authentication
update auth.providers
set enabled = true
where provider = 'email';

-- Configure email authentication settings
update auth.config
set email_confirm_required = false,
    email_change_confirm_required = false;
