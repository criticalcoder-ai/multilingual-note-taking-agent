import { useState } from 'react';
import { TextField, Chip, Autocomplete, Box } from '@mui/material';

const tags = ['meeting', 'interview', 'podcast'];

export default function TagSelector() {
  const [selectedTags, setSelectedTags] = useState(tags);

  return (
    <Box sx={{ 
        width: '100%',
        backgroundColor: '#003b54',
        padding: 2,
        borderRadius: 2,
      }}
      >
      <Autocomplete
        multiple
        id="tags-filled"
        options={[]}
        freeSolo
        value={selectedTags}
        onChange={(_, newValue) => {
          setSelectedTags(newValue);
        }}
        renderTags={(value, getTagProps) =>
          value.map((option, index) => (
            <Chip
              variant="outlined"
              label={option}
              {...getTagProps({ index })}
              key={option}
            />
          ))
        }
        renderInput={(params) => (
          <TextField
            {...params}
            variant="filled"
            placeholder="Enter your tags"
            sx={{
                backgroundColor: '#fff',
                borderRadius: 2,
                fontFamily: 'inherit'
              }}
          />
        )}
      />
    </Box>
  );
}
