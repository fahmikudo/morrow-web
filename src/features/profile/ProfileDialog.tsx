import { useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Avatar,
  Button,
  FieldError,
  Input,
  Label,
  Modal,
  TextField,
} from '@heroui/react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { z } from 'zod';
import { RelativeTime } from '@/components/shared/RelativeTime';
import { useIsDesktop } from '@/hooks/use-media-query';
import { formatDate } from '@/lib/date';
import { initials } from '@/lib/initials';
import { useProfile, useUpdateProfile } from './queries';

const profileSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Name is required')
    .max(60, 'Keep the name under 60 characters'),
  email: z.string().trim().email('Enter a valid email'),
  role: z.string().max(60, 'Keep the role under 60 characters').optional(),
  timezone: z.string().max(60, 'Keep the timezone under 60 characters').optional(),
});

type ProfileValues = z.infer<typeof profileSchema>;

type ProfileDialogProps = {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
};

export function ProfileDialog({ isOpen, onOpenChange }: ProfileDialogProps) {
  const isDesktop = useIsDesktop();
  const { data: profile } = useProfile();
  const updateProfile = useUpdateProfile();

  const { control, handleSubmit, reset, formState } = useForm<ProfileValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: { name: '', email: '', role: '', timezone: '' },
  });

  const previewName = useWatch({ control, name: 'name' });

  useEffect(() => {
    if (!isOpen || !profile) return;
    reset({
      name: profile.name,
      email: profile.email,
      role: profile.role ?? '',
      timezone: profile.timezone ?? '',
    });
  }, [isOpen, profile, reset]);

  const onSubmit = handleSubmit(async (values) => {
    try {
      await updateProfile.mutateAsync({
        name: values.name,
        email: values.email,
        role: values.role?.trim() ?? '',
        timezone: values.timezone?.trim() ?? '',
      });
      onOpenChange(false);
    } catch {
      // The mutation hook already surfaced the error as a toast.
    }
  });

  return (
    <Modal.Backdrop isOpen={isOpen} onOpenChange={onOpenChange}>
      <Modal.Container placement={isDesktop ? 'center' : 'bottom'} size="md">
        <Modal.Dialog className="sm:max-w-md">
          <Modal.CloseTrigger />
          <Modal.Header>
            <div className="flex items-center gap-3">
              <Avatar className="size-10">
                <Avatar.Fallback>{initials(previewName || profile?.name || '?')}</Avatar.Fallback>
              </Avatar>
              <div className="min-w-0">
                <Modal.Heading>Profile</Modal.Heading>
                <p className="text-xs text-muted">Mock local user — nothing leaves this browser.</p>
              </div>
            </div>
          </Modal.Header>
          <Modal.Body>
            <form id="profile-form" onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
              <Controller
                control={control}
                name="name"
                render={({ field }) => (
                  <TextField
                    isInvalid={Boolean(formState.errors.name)}
                    value={field.value}
                    onChange={field.onChange}
                  >
                    <Label>Name</Label>
                    <Input autoFocus placeholder="Your name" />
                    <FieldError>{formState.errors.name?.message}</FieldError>
                  </TextField>
                )}
              />

              <Controller
                control={control}
                name="email"
                render={({ field }) => (
                  <TextField
                    isInvalid={Boolean(formState.errors.email)}
                    value={field.value}
                    onChange={field.onChange}
                    type="email"
                  >
                    <Label>Email</Label>
                    <Input placeholder="you@example.com" />
                    <FieldError>{formState.errors.email?.message}</FieldError>
                  </TextField>
                )}
              />

              <div className="grid gap-4 sm:grid-cols-2">
                <Controller
                  control={control}
                  name="role"
                  render={({ field }) => (
                    <TextField
                      isInvalid={Boolean(formState.errors.role)}
                      value={field.value ?? ''}
                      onChange={field.onChange}
                    >
                      <Label>Role (optional)</Label>
                      <Input placeholder="Product engineer" />
                      <FieldError>{formState.errors.role?.message}</FieldError>
                    </TextField>
                  )}
                />

                <Controller
                  control={control}
                  name="timezone"
                  render={({ field }) => (
                    <TextField
                      isInvalid={Boolean(formState.errors.timezone)}
                      value={field.value ?? ''}
                      onChange={field.onChange}
                    >
                      <Label>Timezone (optional)</Label>
                      <Input placeholder="Asia/Jakarta" />
                      <FieldError>{formState.errors.timezone?.message}</FieldError>
                    </TextField>
                  )}
                />
              </div>

              {profile ? (
                <p className="text-xs text-muted">
                  Joined {formatDate(profile.joinedAt)} · updated{' '}
                  <RelativeTime iso={profile.updatedAt} />
                </p>
              ) : null}
            </form>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="tertiary" onPress={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" form="profile-form" isPending={updateProfile.isPending}>
              Save profile
            </Button>
          </Modal.Footer>
        </Modal.Dialog>
      </Modal.Container>
    </Modal.Backdrop>
  );
}
