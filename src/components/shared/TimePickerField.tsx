import { Button, FieldError, Label, TimeField } from '@heroui/react';
import { fromTimeValue, toTimeValue } from '@/lib/calendar-date';

type TimeFieldFieldProps = {
  label: string;
  /** Local `HH:mm`, or `''` for no time. */
  value: string;
  onChange: (time: string) => void;
  isInvalid?: boolean;
  error?: string;
  clearable?: boolean;
};

export function TimePickerField({
  label,
  value,
  onChange,
  isInvalid = false,
  error,
  clearable = true,
}: TimeFieldFieldProps) {
  return (
    <div className="flex flex-col gap-1">
      <TimeField
        className="w-full"
        value={toTimeValue(value)}
        onChange={(next) => onChange(fromTimeValue(next))}
        isInvalid={isInvalid}
      >
        <Label>{label}</Label>
        <TimeField.Group>
          <TimeField.Input>{(segment) => <TimeField.Segment segment={segment} />}</TimeField.Input>
        </TimeField.Group>
        <FieldError>{error ?? 'Enter a valid time'}</FieldError>
      </TimeField>
      {clearable && value ? (
        <Button
          size="sm"
          variant="ghost"
          className="self-start text-muted"
          onPress={() => onChange('')}
        >
          Clear time
        </Button>
      ) : null}
    </div>
  );
}
