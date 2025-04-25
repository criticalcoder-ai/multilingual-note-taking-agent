import React from "react";
import {
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  SelectChangeEvent,
} from "@mui/material";

type Option = {
  label: string;
  value: string;
};

interface DropdownProps {
  title: string;
  options: Option[];
  value: string;
  onChange: (selectedValue: string) => void;
}

const Dropdown: React.FC<DropdownProps> = ({
  title,
  options,
  value,
  onChange,
}) => {
  const handleChange = (event: SelectChangeEvent) => {
    const selectedValue = event.target.value;
    onChange(selectedValue);
  };

  return (
    <FormControl
      sx={{
        flex: 1,
        minWidth: 160,
        borderRadius: "8px",
        "& .MuiOutlinedInput-notchedOutline": {
          borderColor: "white",
        },
        "& .MuiSvgIcon-root": {
          color: "white",
        },
        "& .MuiInputBase-input": {
          color: "white",
        },
      }}
      size="small"
    >
      <InputLabel id="option-select-label" sx={{ color: "white" }}>
        {title}
      </InputLabel>
      <Select
        labelId="option-select-label"
        value={value}
        label={title}
        onChange={handleChange}
        sx={{
          borderRadius: "8px",
          backgroundColor: "transparent",
        }}
      >
        {options.map((option) => (
          <MenuItem key={option.value} value={option.value}>
            {option.label}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
};

export default Dropdown;
