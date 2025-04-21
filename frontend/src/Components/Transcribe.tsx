import { styled, useTheme } from "@mui/material/styles";
import { useState } from "react";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import Box from "@mui/material/Box";
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
import MailIcon from "@mui/icons-material/Mail";
import LanguageDropdown from "./Dropdown";
import AudioDropzone from "./AudioDropzone";

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
];

const handleCopy = () => {
  window.alert('Dummy: Content copied to clipboard!');
};

export default function PersistentDrawerLeft() {
  const theme = useTheme();

  const [open, setOpen] = useState(true);
  const [activeTab, setActiveTab] = useState(0);

  const handleDrawerOpen = () => {
    setOpen(true);
  };

  const handleDrawerClose = () => {
    setOpen(false);
  };

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
              {" "}
              History{" "}
            </Typography>
          )}
          <IconButton onClick={handleDrawerClose}>
            {theme.direction === "ltr" ? (
              <ChevronLeftIcon />
            ) : (
              <ChevronRightIcon />
            )}
          </IconButton>
        </DrawerHeader>
        <Divider />
        <List>
          {[
            "Chat 1",
            "Chat 2",
            "Chat 3",
            "Chat 4",
            "Chat 5",
            "Chat 6",
            "Chat 7",
          ].map((text) => (
            <ListItem key={text} disablePadding>
              <ListItemButton>
                <ListItemIcon>
                  <MailIcon />
                </ListItemIcon>
                <ListItemText primary={text} />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
      </Drawer>
      <Main open={open} sx={{ height: "100%" }}>
        <DrawerHeader />
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
                onFileAccepted={(file) => {
                  console.log("Accepted file:", file);
                  // TODO: File will be handled here
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
                defaultValue="english"
                onChange={(val) => console.log("Selected language:", val)}
              />
            </Box>
          </Box>

          <Box
            sx={{
              display: "flex",
              gap: 1,
              flexWrap: "wrap",
              border: "1px solid white",
              borderRadius: "8px",
              padding: 1,
            }}
          >
            {["meeting", "interview", "podcast"].map((tag) => (
              <Box
                key={tag}
                sx={{
                  border: "1px solid white",
                  borderRadius: "8px",
                  px: 2,
                  py: 0.5,
                  display: "inline-block",
                }}
              >
                {tag} ×
              </Box>
            ))}
          </Box>

          <Box
            component="textarea"
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
              border: "1px solid white",
              borderRadius: "8px",
              paddingX: 4,
              paddingY: 1,
              cursor: "pointer",
              "&:hover": {
                backgroundColor: "green",
              },
            }}
          >
            Send / Retry
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
                indicatorColor="secondary"
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
                <Typography>
                  Lorem ipsum dolor sit amet consectetur adipisicing elit. Perferendis sint reprehenderit voluptatibus blanditiis ex quibusdam autem laborum facere corrupti cum ea, adipisci ducimus molestias. Maiores molestias eius nulla odit minus?
                </Typography>
              )}
              {activeTab === 1 && (
                <Typography>
                  Lorem ipsum dolor sit amet consectetur adipisicing elit. Laboriosam temporibus earum maxime ipsam ipsum, eaque ipsa aspernatur rem dolore cumque nam vero nihil officia, assumenda eum, dolor dolores necessitatibus et! Lorem ipsum dolor sit amet consectetur, adipisicing elit. Eaque doloremque necessitatibus praesentium ratione! Alias, rem porro iure, nulla ex velit saepe iste perferendis fugit nostrum eaque, laboriosam animi? Deleniti, dolorem?
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
         
              
            </Box>
          </Box>
        </Box>
      </Main>
    </Box>
  );
}
