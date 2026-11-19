insert into ref.email_template (
  code, version, label, subject_template, html_template, text_template,
  event_type, audience, is_active, variables, effective_from, effective_to
) values (
  'STAFF_INVITATION', 1, 'Invitation d’un membre du personnel',
  'Votre accès à la plateforme CFC Habitat',
  '<p>Bonjour {{prenom}} {{nom}},</p><p>Votre compte professionnel CFC a été préparé. Utilisez ce lien unique avant son expiration pour confirmer votre adresse et choisir votre mot de passe.</p><p><a href="{{lien}}">Activer mon compte</a></p><p>Le lien expire dans {{duree}}. Ne le transférez pas. Si vous n’attendiez pas cette invitation, contactez votre administrateur CFC.</p>',
  'Bonjour {{prenom}} {{nom}},\n\nVotre compte professionnel CFC a été préparé. Utilisez ce lien unique avant son expiration pour confirmer votre adresse et choisir votre mot de passe.\n\nActiver mon compte : {{lien}}\n\nLe lien expire dans {{duree}}. Ne le transférez pas.',
  'STAFF_INVITATION_SENT', 'staff', true,
  array['prenom', 'nom', 'lien', 'date', 'duree', 'logo', 'siege'], current_date, null
)
on conflict do nothing;
