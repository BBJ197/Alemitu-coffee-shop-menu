-- Scheduled (serving-hours) items were removed: every item is served all day.
-- Existing schedule times are discarded.

alter table items drop constraint if exists items_schedule_pair;
alter table items drop column if exists available_from;
alter table items drop column if exists available_to;
