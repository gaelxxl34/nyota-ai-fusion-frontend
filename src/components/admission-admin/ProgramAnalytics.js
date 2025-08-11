import React, { useState } from "react";
import {
  Card,
  CardContent,
  Typography,
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Collapse,
  Grid,
  LinearProgress,
  Button,
} from "@mui/material";
import {
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  School as SchoolIcon,
  People as PeopleIcon,
  Male as MaleIcon,
  Female as FemaleIcon,
  Computer as OnlineIcon,
  LocationCity as CampusIcon,
} from "@mui/icons-material";

/**
 * Program Card Component
 */
const ProgramCard = ({ program, expanded, onToggle }) => {
  const conversionRate = parseFloat(program.conversionRate || 0);

  const getConversionColor = () => {
    if (conversionRate >= 70) return "success";
    if (conversionRate >= 50) return "warning";
    return "error";
  };

  return (
    <Card elevation={1} sx={{ mb: 2 }}>
      <CardContent>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={4}>
            <Box display="flex" alignItems="center" gap={1} mb={1}>
              <SchoolIcon color="primary" />
              <Typography variant="h6" fontWeight={500}>
                {program.name}
              </Typography>
            </Box>
            <Typography variant="body2" color="textSecondary">
              {program.code}
            </Typography>
          </Grid>

          <Grid item xs={6} sm={2}>
            <Typography variant="h5" color="primary" fontWeight="bold">
              {program.applications}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Applications
            </Typography>
          </Grid>

          <Grid item xs={6} sm={2}>
            <Typography variant="h5" color="success.main" fontWeight="bold">
              {program.admitted}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Admitted
            </Typography>
          </Grid>

          <Grid item xs={6} sm={2}>
            <Typography variant="h5" color="secondary.main" fontWeight="bold">
              {program.enrolled}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Enrolled
            </Typography>
          </Grid>

          <Grid item xs={6} sm={2}>
            <Box>
              <Box display="flex" alignItems="center" gap={1} mb={1}>
                <Typography variant="h6" color={`${getConversionColor()}.main`}>
                  {program.conversionRate}%
                </Typography>
                {conversionRate >= 50 ? (
                  <TrendingUpIcon color="success" fontSize="small" />
                ) : (
                  <TrendingDownIcon color="error" fontSize="small" />
                )}
              </Box>
              <LinearProgress
                variant="determinate"
                value={conversionRate}
                color={getConversionColor()}
                sx={{ height: 6, borderRadius: 3 }}
              />
              <Typography variant="caption" color="textSecondary">
                Conversion Rate
              </Typography>
            </Box>
          </Grid>

          <Grid item xs={12} display="flex" justifyContent="flex-end">
            <IconButton onClick={() => onToggle(program.code)}>
              {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            </IconButton>
          </Grid>
        </Grid>

        <Collapse in={expanded}>
          <Box mt={3} pt={2} borderTop={1} borderColor="divider">
            <Grid container spacing={3}>
              {/* Study Modes */}
              <Grid item xs={12} md={4}>
                <Typography variant="subtitle2" gutterBottom>
                  Study Modes
                </Typography>
                <Box display="flex" flexDirection="column" gap={1}>
                  <Box
                    display="flex"
                    alignItems="center"
                    justifyContent="space-between"
                  >
                    <Box display="flex" alignItems="center" gap={1}>
                      <OnlineIcon fontSize="small" color="primary" />
                      <Typography variant="body2">Online</Typography>
                    </Box>
                    <Chip
                      label={program.studyModes?.online || 0}
                      size="small"
                      color="primary"
                      variant="outlined"
                    />
                  </Box>
                  <Box
                    display="flex"
                    alignItems="center"
                    justifyContent="space-between"
                  >
                    <Box display="flex" alignItems="center" gap={1}>
                      <CampusIcon fontSize="small" color="secondary" />
                      <Typography variant="body2">On Campus</Typography>
                    </Box>
                    <Chip
                      label={program.studyModes?.onCampus || 0}
                      size="small"
                      color="secondary"
                      variant="outlined"
                    />
                  </Box>
                </Box>
              </Grid>

              {/* Demographics */}
              <Grid item xs={12} md={4}>
                <Typography variant="subtitle2" gutterBottom>
                  Demographics
                </Typography>
                <Box display="flex" flexDirection="column" gap={1}>
                  <Box
                    display="flex"
                    alignItems="center"
                    justifyContent="space-between"
                  >
                    <Box display="flex" alignItems="center" gap={1}>
                      <MaleIcon fontSize="small" color="info" />
                      <Typography variant="body2">Male</Typography>
                    </Box>
                    <Chip
                      label={program.demographics?.male || 0}
                      size="small"
                      color="info"
                      variant="outlined"
                    />
                  </Box>
                  <Box
                    display="flex"
                    alignItems="center"
                    justifyContent="space-between"
                  >
                    <Box display="flex" alignItems="center" gap={1}>
                      <FemaleIcon fontSize="small" color="secondary" />
                      <Typography variant="body2">Female</Typography>
                    </Box>
                    <Chip
                      label={program.demographics?.female || 0}
                      size="small"
                      color="secondary"
                      variant="outlined"
                    />
                  </Box>
                </Box>
              </Grid>

              {/* Intake Distribution */}
              <Grid item xs={12} md={4}>
                <Typography variant="subtitle2" gutterBottom>
                  Intake Distribution
                </Typography>
                <Box display="flex" flexDirection="column" gap={1}>
                  {Object.entries(program.intakeDistribution || {}).map(
                    ([intake, count]) => (
                      <Box
                        key={intake}
                        display="flex"
                        alignItems="center"
                        justifyContent="space-between"
                      >
                        <Typography
                          variant="body2"
                          sx={{ textTransform: "capitalize" }}
                        >
                          {intake}
                        </Typography>
                        <Chip label={count} size="small" variant="outlined" />
                      </Box>
                    )
                  )}
                </Box>
              </Grid>
            </Grid>

            <Box mt={2} display="flex" gap={1}>
              <Chip
                label={`Avg. Processing: ${program.avgProcessingTime}`}
                variant="outlined"
                size="small"
              />
            </Box>
          </Box>
        </Collapse>
      </CardContent>
    </Card>
  );
};

/**
 * Program Summary Component
 */
const ProgramSummary = ({ summary }) => {
  return (
    <Card elevation={2} sx={{ mb: 3 }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Program Overview
        </Typography>
        <Grid container spacing={3}>
          <Grid item xs={6} sm={3}>
            <Typography variant="h4" color="primary" fontWeight="bold">
              {summary?.totalApplications || 0}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Total Applications
            </Typography>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Typography variant="h4" color="success.main" fontWeight="bold">
              {summary?.totalAdmitted || 0}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Total Admitted
            </Typography>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Typography variant="h4" color="secondary.main" fontWeight="bold">
              {summary?.totalEnrolled || 0}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Total Enrolled
            </Typography>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Typography variant="h4" color="info.main" fontWeight="bold">
              {summary?.overallConversion || 0}%
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Avg. Conversion
            </Typography>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
};

/**
 * Program Analytics Component
 */
const ProgramAnalytics = ({ programAnalytics, loading = false }) => {
  const [expandedProgram, setExpandedProgram] = useState(null);
  const [showTable, setShowTable] = useState(false);

  if (loading) {
    return null; // Skeleton will be handled by parent
  }

  const programs = programAnalytics?.programs || [];
  const summary = programAnalytics?.summary || {};

  const handleToggleExpand = (programCode) => {
    setExpandedProgram(expandedProgram === programCode ? null : programCode);
  };

  return (
    <Box>
      <Box display="flex" alignItems="center" justifyContent="between" mb={3}>
        <Typography variant="h5" fontWeight="bold">
          Program Analytics
        </Typography>
        <Box display="flex" gap={1} ml="auto">
          <Button
            variant={!showTable ? "contained" : "outlined"}
            onClick={() => setShowTable(false)}
            size="small"
          >
            Cards
          </Button>
          <Button
            variant={showTable ? "contained" : "outlined"}
            onClick={() => setShowTable(true)}
            size="small"
          >
            Table
          </Button>
        </Box>
      </Box>

      <ProgramSummary summary={summary} />

      {programs.length === 0 ? (
        <Card elevation={1}>
          <CardContent>
            <Box textAlign="center" py={4}>
              <PeopleIcon
                sx={{ fontSize: 64, color: "textSecondary", mb: 2 }}
              />
              <Typography variant="h6" color="textSecondary" gutterBottom>
                No Program Data Available
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Program analytics will appear here once applications are
                submitted.
              </Typography>
            </Box>
          </CardContent>
        </Card>
      ) : (
        <>
          {!showTable ? (
            // Card View
            <Box>
              {programs.map((program) => (
                <ProgramCard
                  key={program.code}
                  program={program}
                  expanded={expandedProgram === program.code}
                  onToggle={handleToggleExpand}
                />
              ))}
            </Box>
          ) : (
            // Table View
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Program</TableCell>
                    <TableCell align="right">Applications</TableCell>
                    <TableCell align="right">Admitted</TableCell>
                    <TableCell align="right">Enrolled</TableCell>
                    <TableCell align="right">Conversion Rate</TableCell>
                    <TableCell align="right">Online/Campus</TableCell>
                    <TableCell align="right">M/F Ratio</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {programs.map((program) => (
                    <TableRow key={program.code}>
                      <TableCell>
                        <Box>
                          <Typography variant="body1" fontWeight={500}>
                            {program.name}
                          </Typography>
                          <Typography variant="caption" color="textSecondary">
                            {program.code}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell align="right">
                        {program.applications}
                      </TableCell>
                      <TableCell align="right">{program.admitted}</TableCell>
                      <TableCell align="right">{program.enrolled}</TableCell>
                      <TableCell align="right">
                        <Chip
                          label={`${program.conversionRate}%`}
                          color={
                            parseFloat(program.conversionRate) >= 70
                              ? "success"
                              : parseFloat(program.conversionRate) >= 50
                              ? "warning"
                              : "error"
                          }
                          size="small"
                        />
                      </TableCell>
                      <TableCell align="right">
                        {program.studyModes?.online || 0}/
                        {program.studyModes?.onCampus || 0}
                      </TableCell>
                      <TableCell align="right">
                        {program.demographics?.male || 0}/
                        {program.demographics?.female || 0}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </>
      )}
    </Box>
  );
};

export default ProgramAnalytics;
