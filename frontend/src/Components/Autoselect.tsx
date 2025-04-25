import { TextField, Chip, Autocomplete } from "@mui/material";

interface TagSelectorProps {
  selectedTags: string[];
  setSelectedTags: (tags: string[]) => void;
}

const tags = ["meeting", "interview", "podcast"];

export default function TagSelector({
  selectedTags,
  setSelectedTags,
}: TagSelectorProps) {
  return (
    <Autocomplete
      multiple
      id="tags-filled"
      options={tags}
      freeSolo
      value={selectedTags}
      onChange={(_, newValue) => {
        setSelectedTags(newValue);
      }}
      sx={{
        backgroundColor: "black",
        color: "white",
        borderRadius: "8px",
        "& .MuiInputBase-root": {
          backgroundColor: "black",
          color: "white",
        },
        "& .MuiOutlinedInput-root": {
          "& fieldset": {
            borderColor: "white",
          },
          "&:hover fieldset": {
            borderColor: "white",
          },
          "&.Mui-focused fieldset": {
            borderColor: "white",
          },
        },
      }}
      renderTags={(value, getTagProps) =>
        value.map((option, index) => (
          <Chip
            variant="outlined"
            label={option}
            {...getTagProps({ index })}
            key={option}
            sx={{
              backgroundColor: "white",
              color: "black",
              fontWeight: 500,
              borderRadius: "6px",
            }}
          />
        ))
      }
      renderInput={(params) => (
        <TextField
          {...params}
          variant="outlined"
          placeholder="Enter your tags"
          InputProps={{
            ...params.InputProps,
            style: { color: "white", borderColor: "white" },
          }}
          sx={{
            "& .MuiOutlinedInput-input": { color: "white" },
            "& .MuiInputLabel-root": { color: "white" },
            "& .MuiOutlinedInput-root": {
              "& fieldset": { borderColor: "white" },
              "&:hover fieldset": { borderColor: "white" },
              "&.Mui-focused fieldset": { borderColor: "white" },
            },
          }}
        />
      )}
    />
  );
}
