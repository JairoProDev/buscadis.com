import type { Meta, StoryObj } from '@storybook/react';
import { EmptyState } from '../empty-state';
import { Icon } from '../icon';
import { Badge } from '../badge';
import { Chip } from '../chip';
import { Avatar } from '../avatar';
import { Skeleton } from '../skeleton';
import { Spinner } from '../spinner';

const meta: Meta = { title: 'Primitives/Feedback' };
export default meta;

export const EmptyNoResults: StoryObj = {
  render: () => (
    <EmptyState
      variant="no-results"
      icon={<Icon name="search" size={24} />}
      title="No encontramos adisos"
      description="Prueba a quitar filtros o ampliar el radio de búsqueda."
      action={{ label: 'Ver todos', onClick: () => undefined }}
    />
  ),
};

export const Badges: StoryObj = {
  render: () => (
    <div className="flex flex-wrap gap-2 p-4">
      <Badge>Neutral</Badge>
      <Badge variant="accent">Nuevo</Badge>
      <Badge variant="success">Verificado</Badge>
      <Badge variant="warning">Pendiente</Badge>
      <Badge variant="danger">Agotado</Badge>
    </div>
  ),
};

export const Chips: StoryObj = {
  render: () => (
    <div className="flex flex-wrap gap-2 p-4">
      <Chip>Cusco</Chip>
      <Chip selected count={12}>
        Inmuebles
      </Chip>
      <Chip disabled>Eventos</Chip>
    </div>
  ),
};

export const Avatars: StoryObj = {
  render: () => (
    <div className="flex items-center gap-3 p-4">
      <Avatar name="Ana Pérez" size="sm" />
      <Avatar name="Carlos Ruiz" size="md" />
      <Avatar name="María López" size="lg" />
    </div>
  ),
};

export const Loading: StoryObj = {
  render: () => (
    <div className="flex flex-col gap-3 p-4">
      <Spinner />
      <Skeleton className="h-4 w-48" />
      <Skeleton className="h-24 w-full" rounded="lg" />
    </div>
  ),
};
