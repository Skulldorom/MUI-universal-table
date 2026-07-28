import {
  TableBody,
  TableCell,
  TableRow,
  Skeleton,
  TableHead,
} from "@mui/material";

const skeletonRows = ["row-1", "row-2", "row-3", "row-4", "row-5"];
const skeletonCells = ["cell-1", "cell-2", "cell-3", "cell-4"];

const TableLoader = () => {
  return (
    <>
      <TableHead />
      <TableBody>
        {skeletonRows.map((rowKey) => (
          <TableRow key={rowKey}>
            {skeletonCells.map((cellKey) => (
              <TableCell key={cellKey}>
                <Skeleton height={30} />
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </>
  );
};

export default TableLoader;
