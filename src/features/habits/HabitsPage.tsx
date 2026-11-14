import { useState } from 'react';
import { ListChecks, Plus } from 'lucide-react';
import { Button, ListBox, Select, Tabs } from '@heroui/react';
import { AreaBadge } from '@/components/shared/AreaBadge';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { EmptyState } from '@/components/shared/EmptyState';
import { InsightStrip } from '@/components/shared/InsightStrip';
import { ErrorState } from '@/components/shared/ErrorState';
import { PageHeader } from '@/components/shared/PageHeader';
import { SkeletonList } from '@/components/shared/SkeletonList';
import { useAreas } from '@/features/areas/queries';
import { useProjects } from '@/features/projects/queries';
import { effectiveAreaId } from '@/lib/area';
import { todayIso } from '@/lib/date';
import { habitInsights } from '@/lib/insights';
import { isHabitEnded } from '@/lib/habits';
import type { Area, Habit } from '@/types';
import { HabitFormDialog } from './HabitFormDialog';
import { HabitRow } from './HabitRow';
import {
  useArchiveHabit,
  useArchivedHabits,
  useDeleteHabit,
  useHabitCheckIns,
  useHabitSkips,
  useHabits,
  useRestoreHabit,
} from './queries';

const ALL_AREAS = 'all';
const NO_AREA = 'none';

type HabitTab = 'active' | 'ended' | 'archived';

export function HabitsPage() {
  const [tab, setTab] = useState<HabitTab>('active');
  const [areaFilter, setAreaFilter] = useState(ALL_AREAS);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Habit | null>(null);

  const habitsQuery = useHabits();
  const archivedQuery = useArchivedHabits();
  const checkInsQuery = useHabitCheckIns();
  const skipsQuery = useHabitSkips();
  const projectsQuery = useProjects();
  const areasQuery = useAreas();
  const archiveHabit = useArchiveHabit();
  const restoreHabit = useRestoreHabit();
  const deleteHabit = useDeleteHabit();

  const isPending =
    habitsQuery.isPending ||
    archivedQuery.isPending ||
    checkInsQuery.isPending ||
    skipsQuery.isPending ||
    projectsQuery.isPending ||
    areasQuery.isPending;
  const isError =
    habitsQuery.isError ||
    archivedQuery.isError ||
    checkInsQuery.isError ||
    skipsQuery.isError ||
    projectsQuery.isError ||
    areasQuery.isError;

  const habits = habitsQuery.data ?? [];
  const archivedHabits = archivedQuery.data ?? [];
  const checkIns = checkInsQuery.data ?? [];
  const skips = skipsQuery.data ?? [];
  const projects = projectsQuery.data ?? [];
  const areas = areasQuery.data ?? [];
  const areaById = new Map(areas.map((area) => [area.id, area]));
  const projectNames = new Map(projects.map((project) => [project.id, project.name]));
  const insights = habitInsights(habits, checkIns);
  const today = todayIso();
  const endedHabits = habits.filter((habit) => isHabitEnded(habit, today));
  const activeHabits = habits.filter((habit) => !isHabitEnded(habit, today));
  const tabHabits =
    tab === 'active' ? activeHabits : tab === 'ended' ? endedHabits : archivedHabits;

  const visible =
    tabHabits
      .filter((habit) => {
        if (areaFilter === ALL_AREAS) return true;
        const areaId = effectiveAreaId(habit, projects);
        return areaFilter === NO_AREA ? !areaId : areaId === areaFilter;
      })
      .sort((a, b) => a.title.localeCompare(b.title));

  const groups = new Map<string, Habit[]>();
  for (const habit of visible) {
    const areaId = effectiveAreaId(habit, projects) ?? NO_AREA;
    const bucket = groups.get(areaId) ?? [];
    bucket.push(habit);
    groups.set(areaId, bucket);
  }

  const orderedGroupKeys = [
    ...areas.map((area) => area.id).filter((id) => groups.has(id)),
    ...(groups.has(NO_AREA) ? [NO_AREA] : []),
  ];

  const openCreate = () => {
    setEditingHabit(null);
    setIsFormOpen(true);
  };

  return (
    <>
      <PageHeader
        title="Habits"
        description="Repeating practice, grouped by the area or project it belongs to."
        actions={
          <Button onPress={openCreate}>
            <Plus className="size-4" aria-hidden />
            New habit
          </Button>
        }
      />

      <InsightStrip
        className="mb-4"
        items={[
          { label: 'Active habits', value: insights.active, hint: 'not archived' },
          {
            label: 'On track',
            value: insights.onTrack,
            tone: 'success',
            hint: 'target met',
          },
          {
            label: 'This week',
            value: insights.weeklyConsistency === null ? '—' : `${insights.weeklyConsistency}%`,
            hint: 'fixed schedules',
          },
          {
            label: 'Best streak',
            value: insights.bestStreak,
            tone: insights.bestStreak > 0 ? 'accent' : 'neutral',
            hint: 'consecutive',
          },
        ]}
      />

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <Tabs
          selectedKey={tab}
          onSelectionChange={(key) => setTab(key as HabitTab)}
          className="min-w-0"
        >
          <Tabs.ListContainer>
            <Tabs.List aria-label="Habit views">
              <Tabs.Tab id="active">
                Active
                <Tabs.Indicator />
              </Tabs.Tab>
              <Tabs.Tab id="ended">
                Ended
                <Tabs.Indicator />
              </Tabs.Tab>
              <Tabs.Tab id="archived">
                Archived
                <Tabs.Indicator />
              </Tabs.Tab>
            </Tabs.List>
          </Tabs.ListContainer>
        </Tabs>

        <Select
          value={areaFilter}
          onChange={(value) => setAreaFilter((value as string) ?? ALL_AREAS)}
          aria-label="Filter habits by area"
          className="w-44 sm:ml-auto"
        >
          <Select.Trigger>
            <Select.Value />
            <Select.Indicator />
          </Select.Trigger>
          <Select.Popover>
            <ListBox>
              <ListBox.Item id="all" textValue="All areas">
                All areas
                <ListBox.ItemIndicator />
              </ListBox.Item>
              {areas.map((area) => (
                <ListBox.Item key={area.id} id={area.id} textValue={area.name}>
                  {area.name}
                  <ListBox.ItemIndicator />
                </ListBox.Item>
              ))}
              <ListBox.Item id={NO_AREA} textValue="No area">
                No area
                <ListBox.ItemIndicator />
              </ListBox.Item>
            </ListBox>
          </Select.Popover>
        </Select>
      </div>

      {isPending ? <SkeletonList rows={3} /> : null}
      {isError ? (
        <ErrorState
          onRetry={() => {
            void habitsQuery.refetch();
            void archivedQuery.refetch();
            void checkInsQuery.refetch();
            void skipsQuery.refetch();
            void projectsQuery.refetch();
            void areasQuery.refetch();
          }}
        />
      ) : null}

      {!isPending && !isError && habits.length === 0 && archivedHabits.length === 0 ? (
        <EmptyState
          icon={ListChecks}
          title="No habits yet"
          description="Start with something small — four runs a week, ten minutes of meditation, twenty pages a day."
          action={<Button onPress={openCreate}>Create habit</Button>}
        />
      ) : null}

      {!isPending && !isError && visible.length === 0 && (habits.length > 0 || archivedHabits.length > 0) ? (
        <EmptyState
          icon={ListChecks}
          title={
            tab === 'active'
              ? 'No habits match this filter'
              : tab === 'ended'
                ? 'No ended habits'
                : 'No archived habits'
          }
          description={
            tab === 'active'
              ? 'Try another area, or clear the filter to see every habit.'
              : tab === 'ended'
                ? 'Habits move here after their optional end date while keeping their history.'
                : 'Archived habits keep their check-in history and can be restored.'
          }
          action={
            tab !== 'archived' ? (
              <Button onPress={() => setAreaFilter(ALL_AREAS)}>Clear filter</Button>
            ) : undefined
          }
        />
      ) : null}

      {orderedGroupKeys.map((areaId) => {
        const area: Area | undefined = areaById.get(areaId);
        const groupHabits = groups.get(areaId) ?? [];

        return (
          <section key={areaId} className="mb-6 flex flex-col gap-2">
            <div className="flex items-center gap-2">
              {area ? (
                <AreaBadge area={area} />
              ) : (
                <span className="text-xs font-medium tracking-wide text-muted uppercase">
                  No area
                </span>
              )}
              <span className="text-xs text-muted">{groupHabits.length}</span>
            </div>

            {groupHabits.map((habit) => (
              <HabitRow
                key={habit.id}
                habit={habit}
                checkIns={checkIns}
                skips={skips}
                area={area}
                projectName={
                  habit.projectId ? projectNames.get(habit.projectId) : undefined
                }
                isArchived={tab === 'archived'}
                onEdit={
                  tab === 'archived'
                    ? undefined
                    : (entry) => {
                        setEditingHabit(entry);
                        setIsFormOpen(true);
                      }
                }
                onArchive={tab === 'archived' ? undefined : (entry) => archiveHabit.mutate(entry.id)}
                onRestore={tab === 'archived' ? (entry) => restoreHabit.mutate(entry.id) : undefined}
                onDelete={tab === 'archived' ? setPendingDelete : undefined}
              />
            ))}
          </section>
        );
      })}

      <HabitFormDialog
        isOpen={isFormOpen}
        onOpenChange={(open) => {
          setIsFormOpen(open);
          if (!open) setEditingHabit(null);
        }}
        habit={editingHabit}
      />

      <ConfirmDialog
        isOpen={Boolean(pendingDelete)}
        onOpenChange={(open) => {
          if (!open) setPendingDelete(null);
        }}
        title="Delete this habit?"
        description={`“${pendingDelete?.title ?? ''}” and its check-in history will be removed permanently. Archiving keeps the history.`}
        confirmLabel="Delete habit"
        isDanger
        isPending={deleteHabit.isPending}
        onConfirm={() => {
          if (pendingDelete) deleteHabit.mutate(pendingDelete.id);
        }}
      />
    </>
  );
}
