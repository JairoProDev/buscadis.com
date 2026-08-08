import type { Meta, StoryObj } from '@storybook/react';
import { Input } from '../input';

const meta: Meta<typeof Input> = {
  title: 'Primitives/Input',
  component: Input,
  args: {
    placeholder: 'tu@email.com',
    type: 'email',
  },
};

export default meta;
type Story = StoryObj<typeof Input>;

export const Default: Story = {};
export const Error: Story = { args: { error: true, defaultValue: 'malo' } };
export const Disabled: Story = { args: { disabled: true, defaultValue: 'bloqueado' } };
