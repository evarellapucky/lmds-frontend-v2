import React from "react";
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Input,
  Button,
  DropdownTrigger,
  Dropdown,
  DropdownMenu,
  DropdownItem,
  Chip,
  User,
  Pagination,
} from "@nextui-org/react";
import { VerticalDotsIcon } from "../UsersAdminDashboard/VerticalDotsIcon";
import { SearchIcon } from "../UsersAdminDashboard/SearchIcon";
import { ChevronDownIcon } from "../UsersAdminDashboard/ChevronDownIcon";
import { columns } from "./data";
import { capitalize } from "./utils";
import { useState } from "react";
import axios from "axios";
import { axiosPrivate } from "../../../api/axios";
import { useEffect } from "react";
import { useAtom } from "jotai";
import { bearerTokenAtom } from "../../../atom/atoms";
import { useNavigate } from "react-router-dom";

const INITIAL_VISIBLE_COLUMNS = [
  "id",
  "title",
  "creator_id",
  "to_display",
  "actions",
];

const PublicationsAdminDashboard = () => {
  const [filterValue, setFilterValue] = React.useState("");
  const [selectedKeys, setSelectedKeys] = React.useState(new Set([]));
  const [visibleColumns, setVisibleColumns] = React.useState(
    new Set(INITIAL_VISIBLE_COLUMNS)
  );
  const [statusFilter, setStatusFilter] = React.useState("all");
  const [rowsPerPage, setRowsPerPage] = React.useState(5);
  const [sortDescriptor, setSortDescriptor] = React.useState({
    column: "age",
    direction: "ascending",
  });
  const [page, setPage] = React.useState(1);
  const [publications, setPublications] = useState([]);
  const [token, setToken] = useAtom(bearerTokenAtom);

  const hasSearchFilter = Boolean(filterValue);

  const navigate = useNavigate();

  const handleDropdownItemClick = (action, publicationId) => {
    switch (action) {
      case "view":
        navigate(`/publications/${publicationId}`);
        break;
      case "delete":
        deletePublicationData(publicationId);
        break;
      default:
        break;
    }
  };

  const deletePublicationData = async (publicationId) => {
    console.log(publicationId)
    const confirmDeletion = window.confirm("Êtes-vous sûr de vouloir supprimer cette publication?");
    if (!confirmDeletion) return;
  
    try {
      const response = await axiosPrivate.delete(`/publications/${publicationId}`, {
        headers: {
          Authorization: token,
          "Content-Type": "application/json",
        },
        withCredentials: true,
      });
  
      console.log("Publication supprimée avec succès", response);
      // Mettre à jour l'état des utilisateurs après suppression
      setPublications((prevPublications) => prevPublications.filter((publication) => publication.id !== publicationId));
    } catch (error) {
      console.error("Erreur lors de la suppression de la publication", error);
    }
  };

  useEffect(() => {
    axiosPrivate
      .get("/publications", {
        headers: {
          Authorization: token,
          "Content-Type": "application/json",
        },
        withCredentials: true,
      })
      .then((response) => {
        setPublications(response.data);
      })
      .catch((error) => {
        console.error(error);
      });
  }, []);

  const headerColumns = React.useMemo(() => {
    if (visibleColumns === "all") return columns;

    return columns.filter((column) =>
      Array.from(visibleColumns).includes(column.uid)
    );
  }, [visibleColumns]);

  const filteredItems = React.useMemo(() => {
    let filteredUsers = [...publications];

    if (hasSearchFilter) {
      filteredUsers = filteredUsers.filter(
        (publication) =>
          publication.title.toLowerCase().includes(filterValue.toLowerCase()) ||
          publication.creator.toLowerCase().includes(filterValue.toLowerCase())
      );
    }
    if (
      statusFilter !== "all" &&
      Array.from(statusFilter).length !== statusOptions.length
    ) {
      filteredUsers = filteredUsers.filter((user) =>
        Array.from(statusFilter).includes(user.status)
      );
    }

    return filteredUsers;
  }, [publications, filterValue, statusFilter]);

  const pages = Math.ceil(filteredItems.length / rowsPerPage);

  const items = React.useMemo(() => {
    const start = (page - 1) * rowsPerPage;
    const end = start + rowsPerPage;

    return filteredItems.slice(start, end);
  }, [page, filteredItems, rowsPerPage]);

  const sortedItems = React.useMemo(() => {
    return [...items].sort((a, b) => {
      const first = a[sortDescriptor.column];
      const second = b[sortDescriptor.column];
      const cmp = first < second ? -1 : first > second ? 1 : 0;

      return sortDescriptor.direction === "descending" ? -cmp : cmp;
    });
  }, [sortDescriptor, items]);

  const renderCell = React.useCallback((publication, columnKey) => {
    console.log(publication)
    const cellValue = publication[columnKey];

    switch (columnKey) {
      case "title" :
        return publication.title;
      case "creator.first_name" :
        return publication.creator_id.first_name;
      case "creator_id" :
        return publication.creator_id;  
      case "to_display":
        // return cellValue ? "Yes" : "No";
        return (
          <Input
          type="checkbox"
          checked={cellValue}
          onChange={() => handleToggleDisplay(publication.id, !cellValue)}
        />
        );
      case "actions":
        return (
          <div className="relative flex justify-start items-center gap-2">
            <Dropdown>
              <DropdownTrigger>
                <Button isIconOnly variant="light">
                  <VerticalDotsIcon className="text-default-300" />
                </Button>
              </DropdownTrigger>
              <DropdownMenu>
                <DropdownItem onClick={() => handleDropdownItemClick("view", publication.id)}>View</DropdownItem>
                <DropdownItem onClick={() => handleDropdownItemClick("delete", publication.id)}>Delete</DropdownItem>
              </DropdownMenu>
            </Dropdown>
          </div>
        );
      default:
        return cellValue;
    }
  }, []);

  const handleToggleDisplay = async (publicationId, newValue) => {
    try {
      const response = await axiosPrivate.put(`/publications/${publicationId}`, {
        to_display: newValue,
      }, {
        headers: {
          Authorization: token,
          "Content-Type": "application/json",
        },
        withCredentials: true,
      });
  
      console.log("Publication mise à jour avec succès", response.data);
  
      // Mettre à jour l'état des publications avec la nouvelle valeur de to_display
      setPublications((prevPublications) =>
        prevPublications.map((publication) =>
          publication.id === publicationId ? { ...publication, to_display: newValue } : publication
        )
      );
    } catch (error) {
      console.error("Erreur lors de la mise à jour de la publication", error);
    }
  };

  const onNextPage = React.useCallback(() => {
    if (page < pages) {
      setPage(page + 1);
    }
  }, [page, pages]);

  const onPreviousPage = React.useCallback(() => {
    if (page > 1) {
      setPage(page - 1);
    }
  }, [page]);

  const onRowsPerPageChange = React.useCallback((e) => {
    setRowsPerPage(Number(e.target.value));
    setPage(1);
  }, []);

  const onSearchChange = React.useCallback((value) => {
    if (value) {
      setFilterValue(value);
      setPage(1);
    } else {
      setFilterValue("");
    }
  }, []);

  const onClear = React.useCallback(() => {
    setFilterValue("");
    setPage(1);
  }, []);

  const topContent = React.useMemo(() => {
    return (
      <div className="flex flex-col gap-4 mt-5">
        <div className="flex justify-between gap-3 items-end">
          <Input
            isClearable
            className="w-full sm:max-w-[44%]"
            placeholder="Search by first_name, last_name, email..."
            startContent={<SearchIcon />}
            value={filterValue}
            onClear={() => onClear()}
            onValueChange={onSearchChange}
          />
          <div className="flex gap-3 mr-5">
            <Dropdown>
              <DropdownTrigger className="hidden sm:flex">
                <Button
                  endContent={<ChevronDownIcon className="text-small" />}
                  variant="flat"
                >
                  Columns
                </Button>
              </DropdownTrigger>
              <DropdownMenu
                disallowEmptySelection
                aria-label="Table Columns"
                closeOnSelect={false}
                selectedKeys={visibleColumns}
                selectionMode="multiple"
                onSelectionChange={setVisibleColumns}
              >
                {columns.map((column) => (
                  <DropdownItem key={column.uid} className="capitalize">
                    {capitalize(column.name)}
                  </DropdownItem>
                ))}
              </DropdownMenu>
            </Dropdown>
          </div>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-default-400 text-small">
            Total {publications.length} publications
          </span>
          <label className="flex items-center text-default-400 text-small mr-5">
            Rows per page:
            <select
              className="bg-transparent outline-none text-default-400 text-small"
              onChange={onRowsPerPageChange}
            >
              <option value="5">5</option>
              <option value="10">10</option>
              <option value="15">15</option>
            </select>
          </label>
        </div>
      </div>
    );
  }, [
    filterValue,
    statusFilter,
    visibleColumns,
    onRowsPerPageChange,
    publications.length,
    onSearchChange,
    hasSearchFilter,
  ]);

  const bottomContent = React.useMemo(() => {
    return (
      <div className="py-2 px-2 flex justify-between items-center mr-5">
        <span className="w-[30%] text-small text-default-400">
          {selectedKeys === "all"
            ? "All items selected"
            : `${selectedKeys.size} of ${filteredItems.length} selected`}
        </span>
        <Pagination
          isCompact
          showControls
          showShadow
          color="primary"
          page={page}
          total={pages}
          onChange={setPage}
        />
        <div className="hidden sm:flex w-[30%] justify-end gap-2">
          <Button
            isDisabled={pages === 1}
            size="sm"
            variant="flat"
            onPress={onPreviousPage}
          >
            Previous
          </Button>
          <Button
            isDisabled={pages === 1}
            size="sm"
            variant="flat"
            onPress={onNextPage}
          >
            Next
          </Button>
        </div>
      </div>
    );
  }, [selectedKeys, items.length, page, pages, hasSearchFilter]);

  return (
    <Table
      aria-label="Example table with custom cells, pagination and sorting"
      bottomContent={bottomContent}
      bottomContentPlacement="outside"
      classNames={{
        wrapper: "max-h-[382px]",
      }}
      selectedKeys={selectedKeys}
      selectionMode="multiple"
      sortDescriptor={sortDescriptor}
      topContent={topContent}
      topContentPlacement="outside"
      onSelectionChange={setSelectedKeys}
      onSortChange={setSortDescriptor}
    >
      <TableHeader columns={headerColumns}>
        {(column) => (
          <TableColumn
            key={column.uid}
            align={column.uid === "actions" ? "center" : "start"}
            allowsSorting={column.sortable}
          >
            {column.name}
          </TableColumn>
        )}
      </TableHeader>
      <TableBody emptyContent={"No publications found"} items={sortedItems}>
        {(item) => (
          <TableRow key={item.id}>
            {(columnKey) => (
              <TableCell>{renderCell(item, columnKey)}</TableCell>
            )}
          </TableRow>
        )}
      </TableBody>
    </Table>
  );

};

export default PublicationsAdminDashboard;