import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Box, Typography, CircularProgress } from "@mui/material";

const Users = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect to UserManagement
    navigate("/super-admin/users");
  }, [navigate]);

  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh",
      }}
    >
      <CircularProgress />
      <Typography sx={{ ml: 2 }}>Redirecting to User Management...</Typography>
    </Box>
  );
};

export default Users;
