'use client';

// ============================================================
// Events — browse, RSVP/waitlist, my events, create, detail
// ============================================================
import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { CalendarDays, Clock, Globe, Loader2, MapPin, Plus, Ticket, Users, Video } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { eventsApi } from '@/lib/db/client';
import type { AppEvent } from '@/lib/db/types';
import { useApp } from '@/components/app/app-context';
import { useAppStore } from '@/stores/useAppStore';
import { UserAvatar } from '@/components/shared/user-avatar';
import { EmptyState } from '@/components/shared/primitives';
import { formatDateTime } from '@/lib/format';

const TIMEZONES = ['Africa/Lagos', 'Africa/Accra', 'Africa/Nairobi', 'Africa/Casablanca', 'Africa/Johannesburg', 'UTC', 'Europe/London'];

function EventCard({ event, onOpen }: { event: AppEvent; onOpen: () => void }) {
  const { user } = useApp();
  const registered = event.attendeeIds.includes(user?.id ?? '');
  const waitlisted = event.waitlistIds.includes(user?.id ?? '');
  const spotsLeft = event.capacity - event.attendeeIds.length;

  return (
    <Card className="group cursor-pointer overflow-hidden transition-shadow hover:shadow-md" onClick={onOpen}>
      <div className="relative h-32">
        {event.coverImage ? (
           
          <img src={event.coverImage} alt={event.name} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-org-primary to-org-secondary text-white">
            <CalendarDays className="h-8 w-8 opacity-60" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <div className="absolute bottom-2.5 left-3 right-3 flex items-end justify-between gap-2">
          <div className="min-w-0">
            <Badge variant="secondary" className="mb-1 bg-white/90 text-gray-900">{event.type === 'online' ? 'Online' : event.type === 'hybrid' ? 'Hybrid' : 'In person'}</Badge>
            <p className="truncate text-sm font-bold text-white drop-shadow">{event.name}</p>
          </div>
          {(registered || waitlisted) && (
            <Badge className={registered ? 'bg-emerald-600' : 'bg-amber-600'}>{registered ? 'Registered' : 'Waitlisted'}</Badge>
          )}
        </div>
      </div>
      <CardContent className="space-y-2 p-3.5">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Clock className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate">{formatDateTime(event.startTime)}</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          {event.type === 'online' ? <Video className="h-3.5 w-3.5 shrink-0" /> : <MapPin className="h-3.5 w-3.5 shrink-0" />}
          <span className="truncate">{event.type === 'online' ? 'Virtual event' : `${event.venue ?? event.address ?? 'Venue TBD'}`}</span>
        </div>
        <div className="flex items-center justify-between border-t pt-2 text-[11px] text-muted-foreground">
          <span className="flex items-center gap-1"><Users className="h-3 w-3" /> {event.attendeeIds.length}/{event.capacity} attending</span>
          {spotsLeft > 0 && spotsLeft <= 10 && <span className="font-medium text-amber-600">{spotsLeft} spots left</span>}
          {spotsLeft <= 0 && <span className="font-medium text-amber-600">Waitlist open</span>}
        </div>
      </CardContent>
    </Card>
  );
}

function CreateEventDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const { user, org } = useApp();
  const queryClient = useQueryClient();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<'online' | 'in-person'>('online');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('10:00');
  const [link, setLink] = useState('');
  const [venue, setVenue] = useState('');
  const [address, setAddress] = useState('');
  const [capacity, setCapacity] = useState('100');

  const mutation = useMutation({
    mutationFn: () => eventsApi.create({
      orgId: org!.id, createdBy: user!.id, name, description, type,
      startTime: new Date(`${date}T${time}`).toISOString(),
      endTime: new Date(new Date(`${date}T${time}`).getTime() + 3600000).toISOString(),
      externalLink: type === 'online' ? link || undefined : undefined,
      venue: type === 'in-person' ? venue || undefined : undefined,
      address: type === 'in-person' ? address || undefined : undefined,
      capacity: parseInt(capacity) || 100,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      onOpenChange(false);
      setName(''); setDescription(''); setLink(''); setVenue(''); setAddress('');
      toast.success('Event created — visible to your community.');
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Create an event</DialogTitle>
          <DialogDescription>Organize a webinar, meetup or workshop for your community.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Event name *</Label>
            <Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Fintech Founders Roundtable" />
          </div>
          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} placeholder="Agenda, speakers, what to expect…" />
          </div>
          <div className="flex items-center justify-between rounded-lg border p-3">
            <div className="flex items-center gap-2 text-sm font-medium"><Globe className="h-4 w-4" /> Online event</div>
            <Switch checked={type === 'online'} onCheckedChange={v => setType(v ? 'online' : 'in-person')} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Date *</Label>
              <Input type="date" value={date} onChange={e => setDate(e.target.value)} min={new Date().toISOString().split('T')[0]} />
            </div>
            <div className="space-y-2">
              <Label>Time *</Label>
              <Input type="time" value={time} onChange={e => setTime(e.target.value)} />
            </div>
          </div>
          {type === 'online' ? (
            <div className="space-y-2">
              <Label>Meeting link</Label>
              <Input value={link} onChange={e => setLink(e.target.value)} placeholder="https://meet…" />
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Venue</Label>
                <Input value={venue} onChange={e => setVenue(e.target.value)} placeholder="Venue name" />
              </div>
              <div className="space-y-2">
                <Label>Address</Label>
                <Input value={address} onChange={e => setAddress(e.target.value)} placeholder="Street, city" />
              </div>
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Capacity</Label>
              <Input type="number" min="1" value={capacity} onChange={e => setCapacity(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Time zone</Label>
              <Select defaultValue="Africa/Lagos">
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{TIMEZONES.map(tz => <SelectItem key={tz} value={tz}>{tz}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button disabled={!name.trim() || !date || mutation.isPending} onClick={() => mutation.mutate()}>
            {mutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Create event'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function EventDetailDialog({ eventId, onOpenChange }: { eventId: string | undefined; onOpenChange: (v: boolean) => void }) {
  const { user } = useApp();
  const navigate = useAppStore(s => s.navigate);
  const queryClient = useQueryClient();
  const { data: event } = useQuery({
    queryKey: ['event', eventId],
    queryFn: () => eventsApi.get(eventId!),
    enabled: !!eventId,
  });
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['events'] });

  const registerMutation = useMutation({
    mutationFn: () => eventsApi.register(eventId!, user!.id),
    onSuccess: ({ waitlisted }) => {
      invalidate();
      queryClient.invalidateQueries({ queryKey: ['event'] });
      toast[waitlisted ? 'warning' : 'success'](waitlisted ? 'Event at capacity — you have been added to the waitlist.' : 'Registration confirmed!');
    },
    onError: (e: Error) => toast.error(e.message),
  });
  const cancelMutation = useMutation({
    mutationFn: () => eventsApi.unregister(eventId!, user!.id),
    onSuccess: () => { invalidate(); queryClient.invalidateQueries({ queryKey: ['event'] }); toast.success('Registration cancelled.'); },
  });

  if (!event) return null;
  const registered = event.attendeeIds.includes(user?.id ?? '');
  const waitlisted = event.waitlistIds.includes(user?.id ?? '');
  const isPast = new Date(event.startTime) < new Date();

  return (
    <Dialog open={!!eventId} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
        {event.coverImage && (
           
          <img src={event.coverImage} alt={event.name} className="h-44 w-full rounded-lg object-cover" />
        )}
        <DialogHeader>
          <div className="flex flex-wrap items-center gap-2">
            <Badge style={{ backgroundColor: 'var(--org-primary)' }}>{event.type === 'online' ? 'Online' : event.type === 'hybrid' ? 'Hybrid' : 'In person'}</Badge>
            <Badge variant="secondary">{event.visibility.replace('_', ' ').toLowerCase()}</Badge>
            {isPast && <Badge variant="outline">Past event</Badge>}
          </div>
          <DialogTitle className="text-lg leading-snug">{event.name}</DialogTitle>
          <DialogDescription>
            {formatDateTime(event.startTime)} ({event.timeZone}) · {event.attendeeIds.length}/{event.capacity} attending
          </DialogDescription>
        </DialogHeader>

        <p className="whitespace-pre-wrap text-sm leading-relaxed">{event.description}</p>

        <div className="space-y-2 rounded-lg border bg-muted/30 p-3 text-sm">
          <p className="flex items-center gap-2"><Clock className="h-4 w-4 text-muted-foreground" /> {formatDateTime(event.startTime)} → {formatDateTime(event.endTime)}</p>
          {event.type === 'online' && event.externalLink && (
            <p className="flex items-center gap-2"><Video className="h-4 w-4 text-muted-foreground" />
              <a href={event.externalLink} target="_blank" rel="noreferrer" className="font-medium text-primary hover:underline">Join link (activates at start)</a>
            </p>
          )}
          {event.type !== 'online' && (
            <p className="flex items-center gap-2"><MapPin className="h-4 w-4 text-muted-foreground" /> {[event.venue, event.address].filter(Boolean).join(', ')}</p>
          )}
        </div>

        {event.attendeeIds.length > 0 && (
          <div>
            <p className="mb-2 text-xs font-semibold text-muted-foreground">Attending ({event.attendeeIds.length})</p>
            <div className="flex flex-wrap gap-1.5">
              {event.attendeeIds.slice(0, 10).map(id => <AttendeeChip key={id} userId={id} onClick={() => { onOpenChange(false); navigate('profile', { id }); }} />)}
              {event.attendeeIds.length > 10 && <Badge variant="secondary">+{event.attendeeIds.length - 10} more</Badge>}
            </div>
          </div>
        )}

        {!isPast && (
          <DialogFooter className="gap-2 sm:justify-between">
            {registered ? (
              <>
                <p className="flex items-center gap-1.5 text-sm font-medium text-emerald-600"><Ticket className="h-4 w-4" /> You are registered</p>
                <Button variant="outline" disabled={cancelMutation.isPending} onClick={() => cancelMutation.mutate()}>
                  {cancelMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Cancel registration</>}
                </Button>
              </>
            ) : waitlisted ? (
              <>
                <p className="text-sm font-medium text-amber-600">On the waitlist — auto-promoted if a spot frees up.</p>
                <Button variant="outline" onClick={() => cancelMutation.mutate()}>Leave waitlist</Button>
              </>
            ) : (
              <Button className="sm:ml-auto" disabled={registerMutation.isPending} onClick={() => registerMutation.mutate()}>
                {registerMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Register {event.attendeeIds.length >= event.capacity ? '(waitlist)' : ''}</>}
              </Button>
            )}
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}

function AttendeeChip({ userId, onClick }: { userId: string; onClick: () => void }) {
  const { data: u } = useQuery({ queryKey: ['user', userId], queryFn: () => import('@/lib/db/client').then(m => m.usersApi.get(userId)), staleTime: 60_000 });
  return (
    <button onClick={onClick} className="flex items-center gap-1.5 rounded-full border py-0.5 pl-0.5 pr-2.5 hover:bg-muted/50" title={u ? `${u.firstName} ${u.lastName}` : 'Member'}>
      <UserAvatar user={u} size="xs" />
      <span className="text-[11px] font-medium">{u ? u.firstName : 'Member'}</span>
    </button>
  );
}

export function EventsView({ initialEventId }: { initialEventId?: string }) {
  const { user, org } = useApp();
  const [openEventId, setOpenEventId] = useState<string | undefined>(initialEventId);
  const [createOpen, setCreateOpen] = useState(false);
  const [showMine, setShowMine] = useState(false);

  const { data: events = [], isLoading } = useQuery({
    queryKey: ['events', org?.id],
    queryFn: () => eventsApi.list(org!.id),
    enabled: !!org,
  });

  const upcoming = useMemo(() => events.filter(e => new Date(e.startTime) >= new Date()), [events]);
  const mine = useMemo(() => events.filter(e => e.createdBy === user?.id || e.attendeeIds.includes(user?.id ?? '')), [events, user?.id]);
  const shown = showMine ? mine : upcoming;

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6">
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Events & Workshops</h1>
          <p className="text-sm text-muted-foreground">Webinars, summits, meetups and workshops from your community.</p>
        </div>
        <Button className="gap-1.5" onClick={() => setCreateOpen(true)}><Plus className="h-4 w-4" /> Create event</Button>
      </div>

      <div className="mb-4 flex gap-2">
        <button
          onClick={() => setShowMine(false)}
          className={`rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors ${!showMine ? 'border-org-primary bg-org-primary text-white' : 'border-border hover:bg-muted/50'}`}
        >
          Recommended ({upcoming.length})
        </button>
        <button
          onClick={() => setShowMine(true)}
          className={`rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors ${showMine ? 'border-org-primary bg-org-primary text-white' : 'border-border hover:bg-muted/50'}`}
        >
          My Events ({mine.length})
        </button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      ) : shown.length === 0 ? (
        <EmptyState icon={CalendarDays} title={showMine ? 'No events to show' : 'No upcoming events'} description={showMine ? 'Register for an event or create your own.' : 'Check back soon or create the first one.'} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {shown.map(event => <EventCard key={event.id} event={event} onOpen={() => setOpenEventId(event.id)} />)}
        </div>
      )}

      <EventDetailDialog eventId={openEventId} onOpenChange={v => !v && setOpenEventId(undefined)} />
      <CreateEventDialog open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  );
}
