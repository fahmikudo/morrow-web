import {
  Button,
  Calendar,
  DateField,
  DatePicker,
  FieldError,
  Label,
} from '@heroui/react';
import { fromCalendarDate, toCalendarDate } from '@/lib/calendar-date';

type DatePickerFieldProps = {
  label: string;
  /** Local `YYYY-MM-DD`, or `''` for no date. */
  value: string;
  onChange: (iso: string) => void;
  calendarLabel?: string;
  isInvalid?: boolean;
  error?: string;
  clearable?: boolean;
};

export function DatePickerField({
  label,
  value,
  onChange,
  calendarLabel = 'Choose a date',
  isInvalid = false,
  error,
  clearable = true,
}: DatePickerFieldProps) {
  return (
    <div className="flex flex-col gap-1">
      <DatePicker
        className="w-full"
        value={toCalendarDate(value)}
        onChange={(next) => onChange(fromCalendarDate(next))}
        isInvalid={isInvalid}
      >
        <Label>{label}</Label>
        <DateField.Group fullWidth>
          <DateField.Input>{(segment) => <DateField.Segment segment={segment} />}</DateField.Input>
          <DateField.Suffix>
            <DatePicker.Trigger>
              <DatePicker.TriggerIndicator />
            </DatePicker.Trigger>
          </DateField.Suffix>
        </DateField.Group>
        <FieldError>{error ?? 'Enter a valid date'}</FieldError>
        <DatePicker.Popover>
          <Calendar aria-label={calendarLabel}>
            <Calendar.Header>
              <Calendar.YearPickerTrigger>
                <Calendar.YearPickerTriggerHeading />
                <Calendar.YearPickerTriggerIndicator />
              </Calendar.YearPickerTrigger>
              <Calendar.NavButton slot="previous" />
              <Calendar.NavButton slot="next" />
            </Calendar.Header>
            <Calendar.Grid>
              <Calendar.GridHeader>
                {(day) => <Calendar.HeaderCell>{day}</Calendar.HeaderCell>}
              </Calendar.GridHeader>
              <Calendar.GridBody>{(date) => <Calendar.Cell date={date} />}</Calendar.GridBody>
            </Calendar.Grid>
            <Calendar.YearPickerGrid>
              <Calendar.YearPickerGridBody>
                {({ year }) => <Calendar.YearPickerCell year={year} />}
              </Calendar.YearPickerGridBody>
            </Calendar.YearPickerGrid>
          </Calendar>
        </DatePicker.Popover>
      </DatePicker>
      {clearable && value ? (
        <Button
          size="sm"
          variant="ghost"
          className="self-start text-muted"
          onPress={() => onChange('')}
        >
          Clear date
        </Button>
      ) : null}
    </div>
  );
}
