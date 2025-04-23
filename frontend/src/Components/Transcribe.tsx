import { styled, useTheme } from "@mui/material/styles";
import { useState, useEffect } from "react";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import Box from "@mui/material/Box";
import ReplayIcon from '@mui/icons-material/Replay';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import Drawer from "@mui/material/Drawer";
import CssBaseline from "@mui/material/CssBaseline";
import MuiAppBar, { AppBarProps as MuiAppBarProps } from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import List from "@mui/material/List";
import Typography from "@mui/material/Typography";
import Divider from "@mui/material/Divider";
import IconButton from "@mui/material/IconButton";
import MenuIcon from "@mui/icons-material/Menu";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import ListItem from "@mui/material/ListItem";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import SendIcon from '@mui/icons-material/Send';
import MailIcon from "@mui/icons-material/Mail";
import ExportPdfButton from "./ExportPDF";
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import SearchIcon from '@mui/icons-material/Search';
import { useNavigate, useParams } from "@tanstack/react-router";

import { copyToClipboard } from "../utils";
import LanguageDropdown from "./Dropdown";
import AudioDropzone from "./AudioDropzone";
import Autoselect from "./Autoselect";


const drawerWidth = 250;

const Main = styled("main", { shouldForwardProp: (prop) => prop !== "open" })<{
  open?: boolean;
}>(({ theme }) => ({
  flexGrow: 1,
  padding: theme.spacing(3),
  transition: theme.transitions.create("margin", {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  marginLeft: `-${drawerWidth}px`,
  variants: [
    {
      props: ({ open }) => open,
      style: {
        transition: theme.transitions.create("margin", {
          easing: theme.transitions.easing.easeOut,
          duration: theme.transitions.duration.enteringScreen,
        }),
        marginLeft: 0,
      },
    },
  ],
}));

interface AppBarProps extends MuiAppBarProps {
  open?: boolean;
}

const AppBar = styled(MuiAppBar, {
  shouldForwardProp: (prop) => prop !== "open",
})<AppBarProps>(({ theme }) => ({
  transition: theme.transitions.create(["margin", "width"], {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  variants: [
    {
      props: ({ open }) => open,
      style: {
        width: `calc(100% - ${drawerWidth}px)`,
        marginLeft: `${drawerWidth}px`,
        transition: theme.transitions.create(["margin", "width"], {
          easing: theme.transitions.easing.easeOut,
          duration: theme.transitions.duration.enteringScreen,
        }),
      },
    },
  ],
}));

const DrawerHeader = styled("div")(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  padding: theme.spacing(0, 1),
  ...theme.mixins.toolbar,
  justifyContent: "flex-end",
}));

const languageOptions = [
  { label: "English (Default)", value: "english" },
  { label: "Mandarin (Traditional)", value: "mandarin" },
  { label: "Simplified Chinese", value: "simplified_chinese" },
  { label: "French", value: "french-fr" },
  { label: "Spanish (Spain)", value: "spain-es" },
  { label: "Spanish (Mexico)", value: "spain-mx" },
  { label: "Portuguese (Portugal)", value: "portuguese-pg" },
  { label: "Portuguese (brazil)", value: "portuguese-bz" },
  { label: "German", value: "german-de" },
];

const transcribedTexts = {
  notes: "Lorem ipsum dolor sit amet consectetur adipisicing elit. Perferendis sint reprehenderit voluptatibus blanditiis ex quibusdam autem laborum facere corrupti cum ea, adipisci ducimus molestias. Maiores molestias eius nulla odit minus?",
  transcription: "Not a Lorem ipsum dolor sit amet consectetur adipisicing elit. Perferendis sint reprehenderit voluptatibus blanditiis ex quibusdam autem laborum facere corrupti cum ea, adipisci ducimus molestias. Maiores molestias eius nulla odit minus?",
}

export default function PersistentDrawerLeft() {
  const theme = useTheme();
  const navigate = useNavigate();
  const { chatId } = useParams({ strict: false }) || { chatId: '1'};

  const [open, setOpen] = useState(true);
  const [activeTab, setActiveTab] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedLanguage, setSelectedLanguage] = useState("english");
  const [prompt, setPrompt] = useState("");
  const [audioFileName, setAudioFileName] = useState("");

  const [sendState, setSendState] = useState(true);

  // TODO: To replace with API call to fetch session inventory
  const chats = ["Session 1", "Session 2", "Session 3", "Session 4", "Session 5", "Session 6", "Session 7", "Session 8", "Session 9", "Session 10", "Session 11", "Session 12", "Session 13", "Session 14", "Session 15", "Session 16", "Session 17", "Session 18", "Session 19", "Session 20"];

  useEffect(() => {
    // Simulate fetching from API
    const fetchSession = async () => {
      // Simulated response based on chatId
      const sessionData = {
        session_name: chatId,
        id: 1,
        query_lang: "french-fr",
        query_prompt: `This is a prompt for ${chatId}`,
        created_time: "2025-04-07T21:53:58.141675",
        query_file: `audio_file_${chatId}.mp3`,
        query_audio_kind: "ambient"
      };
      setSelectedLanguage(sessionData.query_lang.toLowerCase());
      setPrompt(sessionData.query_prompt);
      setAudioFileName(sessionData.query_file);
    };
    fetchSession();
  }, [chatId]);

  const filteredChats = chats.filter((chat) =>
    chat.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCopy = async () => {
    const textToCopy = activeTab === 0 ? transcribedTexts.notes : transcribedTexts.transcription;
    const success = await copyToClipboard(textToCopy);
    console.log(success ? "Text copied to clipboard!" : "Failed to copy text.");
  };

  const handleDrawerOpen = () => setOpen(true);
  const handleDrawerClose = () => setOpen(false);

  return (
    <Box
      sx={{
        display: "flex",
      }}
    >
      <CssBaseline />
      <AppBar position="fixed" open={open}>
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            onClick={handleDrawerOpen}
            edge="start"
            sx={[
              {
                mr: 2,
              },
              open && { display: "none" },
            ]}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div">
            Voice AI - Transcribe
          </Typography>
        </Toolbar>
      </AppBar>
      <Drawer
  sx={{
    width: drawerWidth,
    flexShrink: 0,
    "& .MuiDrawer-paper": {
      width: drawerWidth,
      boxSizing: "border-box",
      display: "flex",
      flexDirection: "column",
    },
  }}
  variant="persistent"
  anchor="left"
  open={open}
>
  <DrawerHeader
    sx={{
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: theme.spacing(0, 1),
      ...theme.mixins.toolbar,
    }}
  >
    {theme.direction === "ltr" && (
      <Typography variant="h6" gutterBottom align="left" marginLeft={1.5}>
        History
      </Typography>
    )}
    <IconButton onClick={handleDrawerClose}>
      {theme.direction === "ltr" ? <ChevronLeftIcon /> : <ChevronRightIcon />}
    </IconButton>
  </DrawerHeader>

  <Divider />

  <Box sx={{ padding: 1 }}>
    <TextField
      fullWidth
      variant="outlined"
      size="small"
      placeholder="Search chats..."
      value={searchTerm}
      onChange={(e) => setSearchTerm(e.target.value)}
      InputProps={{
        startAdornment: (
          <InputAdornment position="start">
            <SearchIcon />
          </InputAdornment>
        ),
      }}
      sx={{
        backgroundColor: "white",
        borderRadius: 1,
      }}
    />
  </Box>

  {/* Chat List with overflow */}
  <List
    sx={{
      flex: 1,
      overflowY: "auto",
    }}
  >
    {filteredChats.length > 0 ? (
      filteredChats.map((text) => (
        <ListItem key={text} disablePadding>
          <ListItemButton onClick={() => navigate({ to: `/chat/${text}` })}>
            <ListItemIcon>
              <MailIcon />
            </ListItemIcon>
            <ListItemText primary={text} />
          </ListItemButton>
        </ListItem>
      ))
    ) : (
      <ListItem>
        <ListItemText primary="No results found." />
      </ListItem>
    )}
  </List>

  {/* New Chat button anchored at bottom */}
  <Box
    sx={{
      alignSelf: "center",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      border: "1px solid black",
      borderRadius: "8px",
      paddingX: 4,
      paddingY: 1,
      margin: 2,
      cursor: "pointer",
      color: "black",
      "&:hover": {
        backgroundColor: "black",
        color: "white",
      },
    }}
    onClick={() => {
      // handle new chat logic here
    }}
  >
    <SendIcon sx={{ marginRight: 1 }} />
    New Chat
  </Box>
</Drawer>

      <Main open={open} sx={{ height: "100%" }}>
        <DrawerHeader />
        <Typography variant="h6" sx={{ color: 'white', mb: 2 }}>Session: {chatId}</Typography>
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            gap: 2,
            padding: 2,
            border: "1px solid white",
            borderRadius: "8px",
            backgroundColor: "#003049",
            color: "white",
          }}
        >
          <Box
            sx={{ display: "flex", justifyContent: "space-between", gap: 2 }}
          >
            <Box sx={{ flex: 1 }}>
              <AudioDropzone
                fileName={audioFileName}
                onFileAccepted={(file) => {
                  console.log("Accepted file:", file);
                }}
              />
            </Box>

            <Box
              sx={{
                flex: 1,
                border: "1px dashed white",
                borderRadius: "8px",
                display: "flex",
                alignItems: "center",
                paddingX: 2,
                paddingY: 1.5,
                color: "white",
                backgroundColor: "#003049",
                minHeight: "56px",
              }}
            >
              <LanguageDropdown
                options={languageOptions}
                value={selectedLanguage}
                onChange={(val) => setSelectedLanguage(val)}
              />
            </Box>
          </Box>

          <Autoselect />

          <Box
            component="textarea"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Enter your prompt here:"
            rows={4}
            sx={{
              width: "100%",
              backgroundColor: "white",
              color: "black",
              border: "1px solid white",
              borderRadius: "8px",
              padding: 1,
              resize: "none",
            }}
          />

          <Box
            sx={{
              alignSelf: "center",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border: "1px solid white",
              borderRadius: "8px",
              paddingX: 4,
              paddingY: 1,
              cursor: "pointer",
              color: "white",
              "&:hover": {
                backgroundColor: "green",
              },
            }}

            onClick={() => {}}
          >
            {sendState ? (<SendIcon sx={{ marginRight: 1 }} />) : (<ReplayIcon sx={{ marginRight: 1 }} />)}
            {sendState ? ("Send") : ("Retry")}
          </Box>
        </Box>

        <Box
          sx={{
            marginTop: 4,
            border: "1px solid white",
            borderRadius: "8px",
            backgroundColor: "#1e1e1e",
            color: "white",
            overflow: "hidden",
          }}
        >
          <Box
            sx={{
              top: 10,
              right: 10,
              borderRadius: "5px",
              padding: 1,
              margin: 2,
              fontSize: "0.85rem",
            }}
          >

            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderBottom: 1,
                borderColor: 'divider',
              }}
            >
              <Tabs
                value={activeTab}
                onChange={(event, newValue) => setActiveTab(newValue)}
                textColor="inherit"
                indicatorColor="primary"
                aria-label="transcription and notes tabs"
                sx={{
                  borderBottom: 1,
                  borderColor: 'divider',
                }}
              >
                <Tab label="Transcription" />
                <Tab label="Notes" />
              </Tabs>
              <IconButton onClick={handleCopy} aria-label="copy" sx={{ color: (theme) => theme.palette.common.white }}>
                <ContentCopyIcon />
              </IconButton>
            </Box>

            <Box
              sx={{
                position: 'relative',
                paddingX: 1,
                paddingY: 2,
                height: 300,
                overflowY: 'auto',
              }}
            >
              {activeTab === 0 && (
                <Typography
                  sx={{
                    padding: 0,
                  }}
                >
                  {transcribedTexts.notes}
                </Typography>
              )}
              {activeTab === 1 && (
                <Typography
                  sx={{
                    padding: 0,
                  }}
                >
                  {transcribedTexts.transcription}
                </Typography>
              )}
            </Box>


            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                width: "100%",
                marginTop: 2,
              }}
            >
         
              <ExportPdfButton
                contentToExport={activeTab === 0 ? transcribedTexts.notes : transcribedTexts.transcription} 
              />
              
            </Box>
          </Box>
        </Box>
      </Main>
    </Box>
  );
}
