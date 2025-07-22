import React from "react";
import {
  WhatsApp as WhatsAppIcon,
  Instagram as InstagramIcon,
  Web as WebsiteIcon,
  Event as EventIcon,
  Campaign as CampaignIcon,
  PersonAdd as ReferralIcon,
  Search as SearchIcon,
  Business as BusinessIcon,
} from "@mui/icons-material";

const SourceIcon = ({ source, sx = {} }) => {
  const getIcon = () => {
    switch (source) {
      case "WHATSAPP":
        return <WhatsAppIcon sx={{ color: "#25D366", ...sx }} />;
      case "INSTAGRAM":
        return <InstagramIcon sx={{ color: "#C13584", ...sx }} />;
      case "WEBSITE":
        return <WebsiteIcon sx={{ color: "#607d8b", ...sx }} />;
      case "EVENT":
        return <EventIcon sx={{ color: "#ff9800", ...sx }} />;
      case "EMAIL":
        return <CampaignIcon sx={{ color: "#f44336", ...sx }} />;
      case "REFERRAL":
        return <ReferralIcon sx={{ color: "#4caf50", ...sx }} />;
      case "META_ADS":
        return <InstagramIcon sx={{ color: "#1877f2", ...sx }} />;
      case "GOOGLE_ADS":
        return <SearchIcon sx={{ color: "#4285f4", ...sx }} />;
      default:
        return <BusinessIcon sx={sx} />;
    }
  };

  return getIcon();
};

export default SourceIcon;
