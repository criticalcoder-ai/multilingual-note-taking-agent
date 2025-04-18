import Button from "@mui/material/Button";
import ButtonAppBar from "./AppBar/AppBar";

const App = () => {
  return (
    <>
      <ButtonAppBar />
      <h3>this is voice ai lorem ipsum</h3>
      <Button variant="contained">my button</Button>
      <Button variant="contained">Transcribe</Button>
    </>
  );
};

export default App;
