import {
  Streamlit,
  StreamlitComponentBase,
  withStreamlitConnection
} from "streamlit-component-lib";
import React, { ReactNode } from "react"

import 'ag-grid-enterprise';
import { AgGridReact } from 'ag-grid-react';
import { Constants } from 'ag-grid-community'

import 'ag-grid-community/dist/styles/ag-grid.css';
import 'ag-grid-community/dist/styles/ag-theme-balham.css';

import moment from 'moment'
import { throws } from "assert";


class AgGrid extends StreamlitComponentBase {

  private agRef: any
  private dtypes: any

  constructor(props: any) {
    super(props)
    this.agRef = React.createRef()
    this.dtypes = this.props.args['dtypes']
  }

  private parseGridData() {
    return JSON.parse(this.props.args['gridData'])
  }

  private parseGridOptions() {
    return this.props.args['gridOptions']
  }

  private onGridReady(event: any) {
    let gridApi = event.api
    gridApi.sizeColumnsToFit()

    // Hack to export filtered rows: https://github.com/ag-grid/ag-grid/issues/1499
    const rowModel = gridApi.rowModel;
    rowModel._originalGetType = rowModel.getType;
    rowModel._fakeGetType = () => Constants.ROW_MODEL_TYPE_SERVER_SIDE;
  }

  private columnTypes: any = {
    columnTypes: {
      'nonEditableColumn': { editable: false },
      'editableColumn': { editable: true },
      'numericRoundedTwoDigitsColumn': {
        valueFormatter: (params: any) => params.value.toFixed(2)
      },
      'numericPercentageColumn': {
        valueFormatter: (params: any) => (params.value * 100).toFixed(2) + "%"
      },
      'numericIntegerColumn': {
        valueFormatter: (params: any) => params.value.toFixed(0)
      },
      'shortDateColumn': {
        filter: 'agDateColumnFilter',
        valueFormatter: (params: any) => moment.utc(params.value).format('DD/MM/YYYY'),
      },
      'yearMonthDateColumn': {
        valueFormatter: (params: any) => moment.utc(params.value).format('MMM/YYYY')
      },
    }

  }

  private returnGridValue() {
    var api = this.agRef.current.api

    // Hack to export filtered rows: https://github.com/ag-grid/ag-grid/issues/1499
    const rowModel = api.rowModel;
    rowModel.getType = rowModel._fakeGetType;
    var return_value = {
      dtypes: this.dtypes,
      csvData: api.getDataAsCsv({ allColumns: true }),
      selectedRows: api.getSelectedRows()
    }

    Streamlit.setComponentValue(return_value)
    rowModel.getType = rowModel._originalGetType;
  }

  public render = (): ReactNode => {

    const gridOptions = Object.assign({}, this.columnTypes, this.parseGridOptions(), { rowData: this.parseGridData() })

    return (
      <div className="ag-theme-balham" style={{ height: this.props.args['height'], width: '100%' }}>
        <AgGridReact
          onGridReady={this.onGridReady}
          onCellValueChanged={() => this.returnGridValue()}
          onSelectionChanged={() => this.returnGridValue()}
          gridOptions={gridOptions}
          ref={this.agRef}
        >
        </AgGridReact>

      </div>
    )
  }

}



//import './styles.scss';


// "withStreamlitConnection" is a wrapper function. It bootstraps the
// connection between your component and the Streamlit app, and handles
// passing arguments from Python -> Component.
//
// You don't need to edit withStreamlitConnection (but you're welcome to!).
export default withStreamlitConnection(AgGrid)
