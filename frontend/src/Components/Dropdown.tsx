import React from "react";
import {
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  SelectChangeEvent,
} from "@mui/material";

type LanguageOption = {
  label: string;
  value: string;
};

interface LanguageDropdownProps {
  options: LanguageOption[];
  value: string;
  onChange: (selectedValue: string) => void;
}

const LanguageDropdown: React.FC<LanguageDropdownProps> = ({
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
      <InputLabel id="language-select-label" sx={{ color: "white" }}>
        Language
      </InputLabel>
      <Select
        labelId="language-select-label"
        value={value}
        label="Language"
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

export default LanguageDropdown;
