// ...existing imports...

const getMenuItems = (role, permissions = []) => {
  switch (role) {
    case "systemAdmin":
      return [
        {
          text: "Dashboard",
          path: "/admin/dashboard",
          icon: <DashboardIcon />,
        },
        {
          text: "Organizations",
          path: "/admin/organizations",
          icon: <BusinessIcon />,
        },
        { text: "Users", path: "/admin/users", icon: <PeopleIcon /> },
        {
          text: "System Leads",
          path: "/admin/leads",
          icon: <AssignmentIcon />,
        },
        // ...other system admin menu items
      ];

    case "organizationAdmin":
      return [
        {
          text: "Dashboard",
          path: "/organization/dashboard",
          icon: <DashboardIcon />,
        },
        {
          text: "Lead Generation",
          path: "/organization/lead-management",
          icon: <AssignmentIcon />,
        },
        {
          text: "Leads Overview",
          path: "/organization/leads",
          icon: <TrendingUpIcon />,
        },
        // ...rest of organization admin menu items...
      ];

    case "leadManager":
      return [
        {
          text: "Dashboard",
          path: "/organization/dashboard",
          icon: <DashboardIcon />,
        },
        {
          text: "Leads Overview",
          path: "/organization/leads",
          icon: <TrendingUpIcon />,
        },
        // ...rest of lead manager menu items...
      ];

    // ...rest of existing cases...
  }
};

// ...rest of existing code...
