import { Table as ATable, type TableProps } from 'antd'
const JknTable = (props: TableProps) => {
  return (
    <div className="custom-table">
      <ATable {...props} />
      <style jsx>
        {
          `
          .custom-table :global(.ant-table-wrapper .ant-table-thead .ant-table-cell){
            padding: 0 8px;;
            background: var(--bg-table-header);
            color: var(--text-secondary-color);
            font-size: 12px;
            line-height: 28px;
            font-weight: normal;
            border-color:   var(--bg-secondary-color);;
          }

          .custom-table.custom-table.custom-table :global(.ant-table-wrapper .ant-table-thead .ant-table-cell::before){
            top: 0;
            bottom: 0;
            transform: none;
            height: auto;
            background-color:  var(--bg-secondary-color);
          }

          .custom-table :global(.ant-table-tbody .ant-table-cell){
            border-color: var( --bg-color);
            padding: 4px;
          }

          .custom-table :global(.ant-table-column-sorter){
            font-size: 7px;
          }
        `
        }
      </style>
    </div>
  )
}

export default JknTable