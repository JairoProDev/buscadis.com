import type { Meta, StoryObj } from '@storybook/react';
import { Button } from '../button';
import { Icon } from '../icon';

const meta: Meta<typeof Button> = {
  title: 'Primitives/Button',
  component: Button,
  args: {
    children: 'Continuar',
    variant: 'primary',
    size: 'md',
  },
  argTypes: {
    variant: {
      control: 'select',
      options: ['primary', 'secondary', 'ghost', 'destructive', 'publish'],
    },
    size: { control: 'select', options: ['sm', 'md', 'lg'] },
  },
};

export default meta;
type Story = StoryObj<typeof Button>;

export const Primary: Story = {};
export const Secondary: Story = { args: { variant: 'secondary' } };
export const Ghost: Story = { args: { variant: 'ghost' } };
export const Destructive: Story = { args: { variant: 'destructive', children: 'Eliminar' } };
export const Publish: Story = {
  args: {
    variant: 'publish',
    children: 'Publicar',
    iconLeft: <Icon name="plus" size={20} />,
  },
};
export const Loading: Story = { args: { loading: true, children: 'Guardando' } };
