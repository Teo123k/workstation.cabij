import * as migration_20260624_105831_init from './20260624_105831_init';

export const migrations = [
  {
    up: migration_20260624_105831_init.up,
    down: migration_20260624_105831_init.down,
    name: '20260624_105831_init'
  },
];
