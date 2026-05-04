-- Sprint 1 dev roster.
insert into public.roster (email, role, class_year, full_name) values
  ('danijeun@gmail.com',         'athlete', 2027, 'Daniel Jeun'),
  ('michael.bindas@njit.edu',    'coach',   2026, 'Michael Bindas'),
  ('captain@example.com',        'athlete', 2026, 'Team Captain'),
  ('alum@example.com',           'alumni',  2018, 'Old Saber')
on conflict (email) do nothing;

-- Sprint 2 will populate founding memories.
