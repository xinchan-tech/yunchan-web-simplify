import { ColumnsType as RcColumnsType, type ColumnType as RcColumnType, type ColumnGroupType as RcColumnGroupType } from 'rc-table';

declare module 'rc-table' {
  interface ColumnType<RecordType> extends RcColumnType<RecordType> {
    sort?: boolean;
    onSort?: (columnKey: keyof RecordType, order: 'asc' | 'desc') => void;
  }

  interface ColumnGroupType<RecordType> extends RcColumnGroupType<RecordType> {
    sort?: boolean;
    onSort?: (columnKey: keyof RecordType,  order: 'asc' | 'desc') => void;
  }
}