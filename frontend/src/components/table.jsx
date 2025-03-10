import * as React from 'react';
import Paper from '@mui/material/Paper';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TablePagination from '@mui/material/TablePagination';
import TableRow from '@mui/material/TableRow';

const columns = [
  { id: 'firstname', label: 'First Name', minWidth: 170 },
  { id: 'lastname', label: 'Last Name', minWidth: 170 },
  { id: 'age', label: 'Age', minWidth: 50,
    format: (value) => value.toLocaleString('en-US'),},
  { id: 'height', label: 'Height (cm)', minWidth: 80,
    format: (value) => value.toLocaleString('en-US'),},
  { id: 'weight', label: 'Weight (kg)', minWidth: 80, 
    format: (value) => value.toLocaleString('en-US'),},
  { id: 'sex', label: 'Sex', minWidth: 80 },
  { id: 'dietrestrictions', label: 'Dietary Restrictions', minWidth: 170 },
  { id: 'bmi', label: 'bmi', minWidth: 80,
    format: (value) => value.toLocaleString('en-US'), },
];

function createData(firstname, lastname, age, height, weight, sex, dietrestrictions) {
  return { firstname, lastname, age, height, weight, sex, dietrestrictions };
}

const rows = [
  createData('Sophia', 'First', 23, 156, 55, 'Female', 'Vegan', '21.6'),
  createData('Joe', 'Last', 45, 180, 80, 'Male', 'Keto', '24.4'),
  createData('Emily', 'Patterson', 32, 165, 60, 'Female', 'Paleo', '22.4'),
  createData('Sophia', 'First', 23, 156, 55, 'Female', 'Vegan', '21.6'),
  createData('Joe', 'Last', 45, 180, 80, 'Male', 'Keto', '24.4'),
  createData('Emily', 'Patterson', 32, 165, 60, 'Female', 'Paleo', '22.4'),  createData('Sophia', 'First', 23, 156, 55, 'Female', 'Vegan', '21.6'),
  createData('Joe', 'Last', 45, 180, 80, 'Male', 'Keto', '24.4'),
  createData('Emily', 'Patterson', 32, 165, 60, 'Female', 'Paleo', '22.4'),  createData('Sophia', 'First', 23, 156, 55, 'Female', 'Vegan', '21.6'),
  createData('Joe', 'Last', 45, 180, 80, 'Male', 'Keto', '24.4'),
  createData('Emily', 'Patterson', 32, 165, 60, 'Female', 'Paleo', '22.4'),  createData('Sophia', 'First', 23, 156, 55, 'Female', 'Vegan', '21.6'),
  createData('Joe', 'Last', 45, 180, 80, 'Male', 'Keto', '24.4'),
  createData('Emily', 'Patterson', 32, 165, 60, 'Female', 'Paleo', '22.4'),  createData('Sophia', 'First', 23, 156, 55, 'Female', 'Vegan', '21.6'),
  createData('Joe', 'Last', 45, 180, 80, 'Male', 'Keto', '24.4'),
  createData('Emily', 'Patterson', 32, 165, 60, 'Female', 'Paleo', '22.4'),  createData('Sophia', 'First', 23, 156, 55, 'Female', 'Vegan', '21.6'),
  createData('Joe', 'Last', 45, 180, 80, 'Male', 'Keto', '24.4'),
  createData('Emily', 'Patterson', 32, 165, 60, 'Female', 'Paleo', '22.4'),  createData('Sophia', 'First', 23, 156, 55, 'Female', 'Vegan', '21.6'),
  createData('Joe', 'Last', 45, 180, 80, 'Male', 'Keto', '24.4'),
  createData('Emily', 'Patterson', 32, 165, 60, 'Female', 'Paleo', '22.4'),  createData('Sophia', 'First', 23, 156, 55, 'Female', 'Vegan', '21.6'),
  createData('Joe', 'Last', 45, 180, 80, 'Male', 'Keto', '24.4'),
  createData('Emily', 'Patterson', 32, 165, 60, 'Female', 'Paleo', '22.4'),
];

export default function StickyHeadTable() {
  const [page, setPage] = React.useState(0);
  const [rowsPerPage, setRowsPerPage] = React.useState(10);

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(+event.target.value);
    setPage(0);
  };

  return (
    <Paper sx={{ width: '100%', overflow: 'hidden' }}>
      <TableContainer sx={{ maxHeight: 1000 }}>
        <Table stickyHeader aria-label="sticky table">
          <TableHead>
            <TableRow>
              {columns.map((column) => (
                <TableCell
                  key={column.id}
                  align={column.align}
                  style={{ minWidth: column.minWidth }}
                >
                  {column.label}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {rows
              .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
              .map((row) => {
                return (
                  <TableRow hover role="checkbox" tabIndex={-1} key={row.code}>
                    {columns.map((column) => {
                      const value = row[column.id];
                      return (
                        <TableCell key={column.id} align={column.align}>
                          {column.format && typeof value === 'number'
                            ? column.format(value)
                            : value}
                        </TableCell>
                      );
                    })}
                  </TableRow>
                );
              })}
          </TableBody>
        </Table>
      </TableContainer>
      <TablePagination
        rowsPerPageOptions={[10, 25, 100]}
        component="div"
        count={rows.length}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
      />
    </Paper>
  );
}
