// Clean file: removed duplicated legacy implementation; only the new smart cache version retained.
import { useState, useRef, useCallback, useEffect } from "react";
import logger from "../utils/logger";
import { leadService } from "../services/leadService";
import { teamService } from "../services/teamService";
import { axiosInstance } from "../services/axiosConfig";

/**
 * Custom hook for caching conversion leads data
 * Implements smart caching with expiration and refresh capabilities
 */
export const useConversionLeadsCache = () => {
  const [leads, setLeads] = useState([]);
  const [teamMembers, setTeamMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [lastFetch, setLastFetch] = useState(null);
  const autoRefreshTimerRef = useRef(null);

  // Configurable auto refresh (ms)
  const AUTO_REFRESH_INTERVAL = 60 * 1000; // 1 minute

  // Cache configuration
  const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds
  const CACHE_KEYS = {
    LEADS: "conversion_leads_cache",
    TEAM_MEMBERS: "team_members_cache",
    TIMESTAMP: "conversion_cache_timestamp",
  };

  /**
   * Check if cache is still valid
   */
  const isCacheValid = useCallback(() => {
    const timestamp = localStorage.getItem(CACHE_KEYS.TIMESTAMP);
    if (!timestamp) return false;

    const cacheTime = parseInt(timestamp);
    const now = Date.now();
    return now - cacheTime < CACHE_DURATION;
  }, [CACHE_DURATION, CACHE_KEYS.TIMESTAMP]);

  /**
   * Get data from cache
   */
  const getFromCache = useCallback(() => {
    try {
      const cachedLeads = localStorage.getItem(CACHE_KEYS.LEADS);
      const cachedTeamMembers = localStorage.getItem(CACHE_KEYS.TEAM_MEMBERS);

      if (cachedLeads && cachedTeamMembers && isCacheValid()) {
        return {
          leads: JSON.parse(cachedLeads),
          teamMembers: JSON.parse(cachedTeamMembers),
          fromCache: true,
        };
      }
    } catch (error) {
      logger.error("Cache read failure", error);
    }
    return null;
  }, [isCacheValid, CACHE_KEYS.LEADS, CACHE_KEYS.TEAM_MEMBERS]);

  /**
   * Save data to cache
   */
  const saveToCache = useCallback(
    (leadsData, teamData) => {
      try {
        localStorage.setItem(CACHE_KEYS.LEADS, JSON.stringify(leadsData));
        localStorage.setItem(CACHE_KEYS.TEAM_MEMBERS, JSON.stringify(teamData));
        localStorage.setItem(CACHE_KEYS.TIMESTAMP, Date.now().toString());
        logger.debug("Saved conversion data to cache");
      } catch (error) {
        logger.error("Cache save failure", error);
      }
    },
    [CACHE_KEYS.LEADS, CACHE_KEYS.TEAM_MEMBERS, CACHE_KEYS.TIMESTAMP]
  );

  /**
   * Clear cache
   */
  const clearCache = useCallback(() => {
    localStorage.removeItem(CACHE_KEYS.LEADS);
    localStorage.removeItem(CACHE_KEYS.TEAM_MEMBERS);
    localStorage.removeItem(CACHE_KEYS.TIMESTAMP);
    logger.info("Cache cleared");
  }, [CACHE_KEYS.LEADS, CACHE_KEYS.TEAM_MEMBERS, CACHE_KEYS.TIMESTAMP]);

  /**
   * Fetch marketing agents from API
   */
  const fetchMarketingAgents = useCallback(async () => {
    try {
      logger.debug("Fetching marketing agents");
      const response = await teamService.getTeamMembers();

      if (response.success && response.members) {
        const marketingAgents = response.members.filter(
          (member) => member.role === "marketingAgent"
        );

        logger.info("Marketing agents fetched", {
          count: marketingAgents.length,
        });

        // Get assigned lead counts for each agent
        const agentsWithLeadCounts = await Promise.all(
          marketingAgents.map(async (agent) => {
            try {
              const assignedLeadsPromises = ["CONTACTED", "INTERESTED"].map(
                async (status) => {
                  try {
                    const response = await leadService.getLeadsByStatus(
                      status,
                      {
                        limit: 10000,
                        offset: 0,
                      }
                    );
                    const leads = response?.data || [];
                    return leads.filter(
                      (lead) => lead.assignedTo === agent.email
                    ).length;
                  } catch (error) {
                    logger.warn("Agent lead fetch failed", {
                      status,
                      email: agent.email,
                      error,
                    });
                    return 0;
                  }
                }
              );

              const leadCounts = await Promise.all(assignedLeadsPromises);
              const totalAssignedCount = leadCounts.reduce(
                (sum, count) => sum + count,
                0
              );

              return {
                id: agent.id,
                name:
                  agent.name || agent.email?.split("@")[0] || "Unknown Agent",
                email: agent.email,
                avatar: null,
                assignedCount: totalAssignedCount,
                status: agent.status === "active" ? "online" : "offline",
                conversionRate: 0,
                maxCapacity: 1000,
                role: agent.role,
                lastSignIn: agent.lastSignIn,
                createdAt: agent.createdAt,
              };
            } catch (error) {
              logger.warn("Agent processing failed", {
                email: agent.email,
                error,
              });
              return {
                id: agent.id,
                name:
                  agent.name || agent.email?.split("@")[0] || "Unknown Agent",
                email: agent.email,
                avatar: null,
                assignedCount: 0,
                status: "offline",
                conversionRate: 0,
                maxCapacity: 1000,
                role: agent.role,
              };
            }
          })
        );

        // Sort by availability (least assigned first)
        agentsWithLeadCounts.sort((a, b) => {
          const aAvailability =
            (a.maxCapacity - a.assignedCount) / a.maxCapacity;
          const bAvailability =
            (b.maxCapacity - b.assignedCount) / b.maxCapacity;
          return bAvailability - aAvailability;
        });

        return agentsWithLeadCounts;
      } else {
        throw new Error("Failed to fetch team members");
      }
    } catch (error) {
      logger.error("Marketing agents fetch failed", error);
      throw error;
    }
  }, []);

  /**
   * Fallback method using individual status calls - defined before main function to avoid hoisting issues
   */
  const fetchConversionLeadsFallback = useCallback(async () => {
    try {
      logger.warn("Using fallback conversion leads method");

      // Use the same efficient approach as before
      const statusPromises = ["CONTACTED", "INTERESTED"].map(async (status) => {
        try {
          logger.debug("Fetching leads by status", { status });
          const statusResponse = await leadService.getLeadsByStatus(status, {
            limit: 10000,
            offset: 0,
            sortBy: "createdAt",
            sortOrder: "desc",
          });
          const leads = statusResponse?.data || [];
          logger.debug("Leads fetched for status", {
            status,
            count: leads.length,
          });

          return leads.map((lead, index) => {
            let extractedCountryCode = null;

            if (lead.phone) {
              // Clean the phone number
              let cleanPhone = lead.phone.replace(/\D/g, "");

              // Remove leading zeros
              while (cleanPhone.startsWith("0")) {
                cleanPhone = cleanPhone.substring(1);
              }

              // Complete country code mapping (same as main method)
              const countryCodeMap = {
                // 3-digit codes (most common for our region)
                212: "Morocco",
                213: "Algeria",
                216: "Tunisia",
                218: "Libya",
                220: "Gambia",
                221: "Senegal",
                222: "Mauritania",
                223: "Mali",
                224: "Guinea",
                225: "Ivory Coast",
                226: "Burkina Faso",
                227: "Niger",
                228: "Togo",
                229: "Benin",
                230: "Mauritius",
                231: "Liberia",
                232: "Sierra Leone",
                233: "Ghana",
                234: "Nigeria",
                235: "Chad",
                236: "Central African Republic",
                237: "Cameroon",
                238: "Cape Verde",
                239: "Sao Tome and Principe",
                240: "Equatorial Guinea",
                241: "Gabon",
                242: "Republic of Congo",
                243: "Democratic Republic of Congo",
                244: "Angola",
                245: "Guinea-Bissau",
                246: "British Indian Ocean Territory",
                248: "Seychelles",
                249: "Sudan",
                250: "Rwanda",
                251: "Ethiopia",
                252: "Somalia",
                253: "Djibouti",
                254: "Kenya",
                255: "Tanzania",
                256: "Uganda",
                257: "Burundi",
                258: "Mozambique",
                260: "Zambia",
                261: "Madagascar",
                262: "Reunion",
                263: "Zimbabwe",
                264: "Namibia",
                265: "Malawi",
                266: "Lesotho",
                267: "Botswana",
                268: "Swaziland",
                269: "Comoros",
                290: "Saint Helena",
                291: "Eritrea",
                297: "Aruba",
                298: "Faroe Islands",
                299: "Greenland",
                350: "Gibraltar",
                351: "Portugal",
                352: "Luxembourg",
                353: "Ireland",
                354: "Iceland",
                355: "Albania",
                356: "Malta",
                357: "Cyprus",
                358: "Finland",
                359: "Bulgaria",
                370: "Lithuania",
                371: "Latvia",
                372: "Estonia",
                373: "Moldova",
                374: "Armenia",
                375: "Belarus",
                376: "Andorra",
                377: "Monaco",
                378: "San Marino",
                380: "Ukraine",
                381: "Serbia",
                382: "Montenegro",
                383: "Kosovo",
                385: "Croatia",
                386: "Slovenia",
                387: "Bosnia and Herzegovina",
                389: "North Macedonia",
                420: "Czech Republic",
                421: "Slovakia",
                423: "Liechtenstein",
                500: "Falkland Islands",
                501: "Belize",
                502: "Guatemala",
                503: "El Salvador",
                504: "Honduras",
                505: "Nicaragua",
                506: "Costa Rica",
                507: "Panama",
                508: "Saint Pierre and Miquelon",
                509: "Haiti",
                590: "Guadeloupe",
                591: "Bolivia",
                592: "Guyana",
                593: "Ecuador",
                594: "French Guiana",
                595: "Paraguay",
                596: "Martinique",
                597: "Suriname",
                598: "Uruguay",
                599: "Netherlands Antilles",
                670: "East Timor",
                672: "Antarctica",
                673: "Brunei",
                674: "Nauru",
                675: "Papua New Guinea",
                676: "Tonga",
                677: "Solomon Islands",
                678: "Vanuatu",
                679: "Fiji",
                680: "Palau",
                681: "Wallis and Futuna",
                682: "Cook Islands",
                683: "Niue",
                684: "American Samoa",
                685: "Samoa",
                686: "Kiribati",
                687: "New Caledonia",
                688: "Tuvalu",
                689: "French Polynesia",
                690: "Tokelau",
                691: "Micronesia",
                692: "Marshall Islands",
                850: "North Korea",
                852: "Hong Kong",
                853: "Macau",
                855: "Cambodia",
                856: "Laos",
                880: "Bangladesh",
                886: "Taiwan",
                960: "Maldives",
                961: "Lebanon",
                962: "Jordan",
                963: "Syria",
                964: "Iraq",
                965: "Kuwait",
                966: "Saudi Arabia",
                967: "Yemen",
                968: "Oman",
                970: "Palestine",
                971: "United Arab Emirates",
                972: "Israel",
                973: "Bahrain",
                974: "Qatar",
                975: "Bhutan",
                976: "Mongolia",
                977: "Nepal",
                992: "Tajikistan",
                993: "Turkmenistan",
                994: "Azerbaijan",
                995: "Georgia",
                996: "Kyrgyzstan",
                998: "Uzbekistan",

                // 2-digit codes
                20: "Egypt",
                27: "South Africa",
                30: "Greece",
                31: "Netherlands",
                32: "Belgium",
                33: "France",
                34: "Spain",
                36: "Hungary",
                39: "Italy",
                40: "Romania",
                41: "Switzerland",
                43: "Austria",
                44: "United Kingdom",
                45: "Denmark",
                46: "Sweden",
                47: "Norway",
                48: "Poland",
                49: "Germany",
                51: "Peru",
                52: "Mexico",
                53: "Cuba",
                54: "Argentina",
                55: "Brazil",
                56: "Chile",
                57: "Colombia",
                58: "Venezuela",
                60: "Malaysia",
                61: "Australia",
                62: "Indonesia",
                63: "Philippines",
                64: "New Zealand",
                65: "Singapore",
                66: "Thailand",
                81: "Japan",
                82: "South Korea",
                84: "Vietnam",
                86: "China",
                90: "Turkey",
                91: "India",
                92: "Pakistan",
                93: "Afghanistan",
                94: "Sri Lanka",
                95: "Myanmar",
                98: "Iran",

                // 1-digit codes
                1: "United States/Canada",
                7: "Russia/Kazakhstan",
              };

              // Try to match country codes by length (longest first for accuracy)
              const codeLengths = [4, 3, 2, 1];

              for (const length of codeLengths) {
                if (cleanPhone.length >= length) {
                  const potentialCode = cleanPhone.substring(0, length);
                  if (countryCodeMap[potentialCode]) {
                    extractedCountryCode = potentialCode;
                    break;
                  }
                }
              }
            }

            return {
              ...lead,
              status: status.toLowerCase(),
              contactedDate: lead.createdAt,
              countryCode: extractedCountryCode,
              // Ensure we have consistent field names
              assignedTo:
                lead.assignedTo ||
                lead.assigned_to ||
                lead.assignedAgent ||
                null,
              name: lead.name || lead.contactInfo?.name || "Unknown",
              email: lead.email || lead.contactInfo?.email || "",
              phone: lead.phone || lead.contactInfo?.phone || "",
            };
          });
        } catch (error) {
          logger.warn("Status leads fetch failed", { status, error });
          return [];
        }
      });

      // Wait for both status fetches to complete
      const statusResults = await Promise.all(statusPromises);

      // Combine all results and sort by createdAt desc
      const allCombinedLeads = statusResults.flat();
      logger.info("Combined leads from statuses", {
        count: allCombinedLeads.length,
      });

      // Sort by creation date (newest first)
      allCombinedLeads.sort((a, b) => {
        const dateA =
          a.createdAt instanceof Date
            ? a.createdAt
            : new Date(a.createdAt || 0);
        const dateB =
          b.createdAt instanceof Date
            ? b.createdAt
            : new Date(b.createdAt || 0);
        return dateB - dateA;
      });

      return allCombinedLeads;
    } catch (error) {
      logger.error("Fallback conversion leads fetch failed", error);
      throw error;
    }
  }, []);

  /**
   * Fetch conversion leads from API using optimized endpoint
   */
  const fetchConversionLeads = useCallback(async () => {
    try {
      logger.debug("Fetching conversion leads (CONTACTED + INTERESTED)");

      // Use the new optimized conversion endpoint
      const response = await axiosInstance.get("/api/leads/conversion", {
        params: {
          useCache: true,
          limit: 10000,
          sortBy: "createdAt",
          sortOrder: "desc",
        },
      });

      if (response.data && response.data.success) {
        const allLeads = response.data.data || [];
        logger.info("Conversion leads fetched", {
          count: allLeads.length,
          cached: response.data.cached,
        });

        // Add country code extraction for each lead
        const enrichedLeads = allLeads.map((lead, index) => {
          let extractedCountryCode = null;

          if (lead.phone) {
            // Clean the phone number
            let cleanPhone = lead.phone.replace(/\D/g, "");

            // Remove leading zeros
            while (cleanPhone.startsWith("0")) {
              cleanPhone = cleanPhone.substring(1);
            }

            // Complete country code mapping (sorted by length for accurate matching)
            const countryCodeMap = {
              // 4-digit codes
              1242: "Bahamas",
              1246: "Barbados",
              1284: "British Virgin Islands",
              1340: "US Virgin Islands",
              1345: "Cayman Islands",
              1441: "Bermuda",
              1473: "Grenada",
              1649: "Turks and Caicos",
              1664: "Montserrat",
              1670: "Northern Mariana Islands",
              1671: "Guam",
              1684: "American Samoa",
              1721: "Sint Maarten",
              1758: "Saint Lucia",
              1767: "Dominica",
              1784: "Saint Vincent",
              1787: "Puerto Rico",
              1809: "Dominican Republic",
              1829: "Dominican Republic",
              1849: "Dominican Republic",
              1868: "Trinidad and Tobago",
              1869: "Saint Kitts and Nevis",
              1876: "Jamaica",
              1939: "Puerto Rico",

              // 3-digit codes
              212: "Morocco",
              213: "Algeria",
              216: "Tunisia",
              218: "Libya",
              220: "Gambia",
              221: "Senegal",
              222: "Mauritania",
              223: "Mali",
              224: "Guinea",
              225: "Ivory Coast",
              226: "Burkina Faso",
              227: "Niger",
              228: "Togo",
              229: "Benin",
              230: "Mauritius",
              231: "Liberia",
              232: "Sierra Leone",
              233: "Ghana",
              234: "Nigeria",
              235: "Chad",
              236: "Central African Republic",
              237: "Cameroon",
              238: "Cape Verde",
              239: "Sao Tome and Principe",
              240: "Equatorial Guinea",
              241: "Gabon",
              242: "Republic of Congo",
              243: "Democratic Republic of Congo",
              244: "Angola",
              245: "Guinea-Bissau",
              246: "British Indian Ocean Territory",
              248: "Seychelles",
              249: "Sudan",
              250: "Rwanda",
              251: "Ethiopia",
              252: "Somalia",
              253: "Djibouti",
              254: "Kenya",
              255: "Tanzania",
              256: "Uganda",
              257: "Burundi",
              258: "Mozambique",
              260: "Zambia",
              261: "Madagascar",
              262: "Reunion",
              263: "Zimbabwe",
              264: "Namibia",
              265: "Malawi",
              266: "Lesotho",
              267: "Botswana",
              268: "Swaziland",
              269: "Comoros",
              290: "Saint Helena",
              291: "Eritrea",
              297: "Aruba",
              298: "Faroe Islands",
              299: "Greenland",
              350: "Gibraltar",
              351: "Portugal",
              352: "Luxembourg",
              353: "Ireland",
              354: "Iceland",
              355: "Albania",
              356: "Malta",
              357: "Cyprus",
              358: "Finland",
              359: "Bulgaria",
              370: "Lithuania",
              371: "Latvia",
              372: "Estonia",
              373: "Moldova",
              374: "Armenia",
              375: "Belarus",
              376: "Andorra",
              377: "Monaco",
              378: "San Marino",
              380: "Ukraine",
              381: "Serbia",
              382: "Montenegro",
              383: "Kosovo",
              385: "Croatia",
              386: "Slovenia",
              387: "Bosnia and Herzegovina",
              389: "North Macedonia",
              420: "Czech Republic",
              421: "Slovakia",
              423: "Liechtenstein",
              500: "Falkland Islands",
              501: "Belize",
              502: "Guatemala",
              503: "El Salvador",
              504: "Honduras",
              505: "Nicaragua",
              506: "Costa Rica",
              507: "Panama",
              508: "Saint Pierre and Miquelon",
              509: "Haiti",
              590: "Guadeloupe",
              591: "Bolivia",
              592: "Guyana",
              593: "Ecuador",
              594: "French Guiana",
              595: "Paraguay",
              596: "Martinique",
              597: "Suriname",
              598: "Uruguay",
              599: "Netherlands Antilles",
              670: "East Timor",
              672: "Antarctica",
              673: "Brunei",
              674: "Nauru",
              675: "Papua New Guinea",
              676: "Tonga",
              677: "Solomon Islands",
              678: "Vanuatu",
              679: "Fiji",
              680: "Palau",
              681: "Wallis and Futuna",
              682: "Cook Islands",
              683: "Niue",
              684: "American Samoa",
              685: "Samoa",
              686: "Kiribati",
              687: "New Caledonia",
              688: "Tuvalu",
              689: "French Polynesia",
              690: "Tokelau",
              691: "Micronesia",
              692: "Marshall Islands",
              850: "North Korea",
              852: "Hong Kong",
              853: "Macau",
              855: "Cambodia",
              856: "Laos",
              880: "Bangladesh",
              886: "Taiwan",
              960: "Maldives",
              961: "Lebanon",
              962: "Jordan",
              963: "Syria",
              964: "Iraq",
              965: "Kuwait",
              966: "Saudi Arabia",
              967: "Yemen",
              968: "Oman",
              970: "Palestine",
              971: "United Arab Emirates",
              972: "Israel",
              973: "Bahrain",
              974: "Qatar",
              975: "Bhutan",
              976: "Mongolia",
              977: "Nepal",
              992: "Tajikistan",
              993: "Turkmenistan",
              994: "Azerbaijan",
              995: "Georgia",
              996: "Kyrgyzstan",
              998: "Uzbekistan",

              // 2-digit codes
              20: "Egypt",
              27: "South Africa",
              30: "Greece",
              31: "Netherlands",
              32: "Belgium",
              33: "France",
              34: "Spain",
              36: "Hungary",
              39: "Italy",
              40: "Romania",
              41: "Switzerland",
              43: "Austria",
              44: "United Kingdom",
              45: "Denmark",
              46: "Sweden",
              47: "Norway",
              48: "Poland",
              49: "Germany",
              51: "Peru",
              52: "Mexico",
              53: "Cuba",
              54: "Argentina",
              55: "Brazil",
              56: "Chile",
              57: "Colombia",
              58: "Venezuela",
              60: "Malaysia",
              61: "Australia",
              62: "Indonesia",
              63: "Philippines",
              64: "New Zealand",
              65: "Singapore",
              66: "Thailand",
              81: "Japan",
              82: "South Korea",
              84: "Vietnam",
              86: "China",
              90: "Turkey",
              91: "India",
              92: "Pakistan",
              93: "Afghanistan",
              94: "Sri Lanka",
              95: "Myanmar",
              98: "Iran",

              // 1-digit codes
              1: "United States/Canada",
              7: "Russia/Kazakhstan",
            };

            // Try to match country codes by length (longest first for accuracy)
            const codeLengths = [4, 3, 2, 1];

            for (const length of codeLengths) {
              if (cleanPhone.length >= length) {
                const potentialCode = cleanPhone.substring(0, length);
                if (countryCodeMap[potentialCode]) {
                  extractedCountryCode = potentialCode;
                  break;
                }
              }
            }

            // Debug logging for first few leads
            // trimmed per-lead debug
          }

          return {
            ...lead,
            countryCode: extractedCountryCode,
            // Ensure we have consistent field names
            assignedTo:
              lead.assignedTo || lead.assigned_to || lead.assignedAgent || null,
            name: lead.name || lead.contactInfo?.name || "Unknown",
            email: lead.email || lead.contactInfo?.email || "",
            phone: lead.phone || lead.contactInfo?.phone || "",
          };
        });

        return enrichedLeads;
      } else {
        throw new Error("Invalid response from conversion leads API");
      }
    } catch (error) {
      logger.error("Conversion leads fetch failed", error);
      // Fallback to the old method if the new endpoint fails
      return await fetchConversionLeadsFallback();
    }
  }, [fetchConversionLeadsFallback]);

  /**
   * Fetch data with caching logic
   */
  const fetchData = useCallback(
    async (useCache = true) => {
      setLoading(true);
      setError(null);

      try {
        // Try to get from cache first
        if (useCache) {
          const cachedData = getFromCache();
          if (cachedData) {
            setLeads(cachedData.leads);
            setTeamMembers(cachedData.teamMembers);
            setLastFetch(new Date());
            setLoading(false);
            logger.info("Loaded conversion data (cache)");
            return;
          }
        }

        // Fetch fresh data
        logger.debug("Fetching fresh conversion + team data");
        const [leadsData, teamData] = await Promise.all([
          fetchConversionLeads(),
          fetchMarketingAgents(),
        ]);

        setLeads(leadsData);
        setTeamMembers(teamData);
        setLastFetch(new Date());

        // Save to cache
        if (useCache) {
          saveToCache(leadsData, teamData);
        }

        logger.info("Fresh conversion data loaded", {
          leads: leadsData.length,
          team: teamData.length,
        });
      } catch (error) {
        logger.error("Conversion data fetch error", error);
        setError("Failed to load conversion data");
      } finally {
        setLoading(false);
      }
    },
    [getFromCache, saveToCache, fetchConversionLeads, fetchMarketingAgents]
  );

  /**
   * Refresh data (force fetch)
   */
  const refresh = useCallback(async () => {
    setRefreshing(true);
    clearCache();
    await fetchData(false);
    setRefreshing(false);
  }, [fetchData, clearCache]);

  /**
   * Optimistically update assignments for given lead IDs
   * @param {Array<string>} leadIds
   * @param {Object|null} assignTo { email, name } or null to unassign
   * @param {Object} meta { assignedByEmail, assignedByName, notes }
   */
  const optimisticallyAssignLeads = useCallback(
    (leadIds, assignTo, meta = {}) => {
      if (!Array.isArray(leadIds) || leadIds.length === 0) return;
      setLeads((prev) =>
        prev.map((lead) => {
          if (!leadIds.includes(lead.id)) return lead;
          const timestamp = new Date().toISOString();
          const previousAssignee = lead.assignedTo || null;
          // Build updated assignment object similar to backend
          const assignment = {
            assignedTo: assignTo ? assignTo.email : null,
            assignedToName: assignTo ? assignTo.name : null,
            assignedBy: meta.assignedByEmail || "frontend-optimistic",
            assignedByName:
              meta.assignedByName || meta.assignedByEmail || "System",
            assignedAt: timestamp,
            previousAssignee,
            notes:
              meta.notes ||
              (assignTo ? `Bulk assigned to ${assignTo.name}` : "Unassigned"),
          };
          // Append lightweight timeline entry (not full parity but enough for UI)
          const timelineEntry = {
            date: timestamp,
            action:
              previousAssignee && assignTo
                ? "REASSIGNED"
                : assignTo
                ? "ASSIGNED"
                : "UNASSIGNED",
            status: lead.status,
            notes: assignment.notes,
            metadata: {
              previousAssignee,
              newAssignee: assignment.assignedTo,
              assignedBy: assignment.assignedBy,
              assignedByName: assignment.assignedByName,
              optimistic: true,
            },
          };
          return {
            ...lead,
            assignedTo: assignment.assignedTo,
            assignment,
            updatedAt: timestamp,
            timeline: Array.isArray(lead.timeline)
              ? [...lead.timeline, timelineEntry]
              : [timelineEntry],
            _optimistic: true,
          };
        })
      );
    },
    []
  );

  /**
   * Reconcile optimistic assignments after server response
   * Accepts server results with assigned/failed arrays (optional)
   */
  const reconcileAfterBulk = useCallback((results, leadIds) => {
    if (!leadIds) return;
    setLeads((prev) =>
      prev.map((lead) => {
        if (!leadIds.includes(lead.id)) return lead;
        // Remove _optimistic marker; trust existing fields (we'll refresh soon)
        const { _optimistic, ...rest } = lead;
        return rest;
      })
    );
  }, []);

  /**
   * Start auto refresh loop (stale-while-revalidate)
   */
  const startAutoRefresh = useCallback(() => {
    if (autoRefreshTimerRef.current) return; // already running
    autoRefreshTimerRef.current = setInterval(() => {
      // Only refresh if cache is stale (> 2 * interval as heuristic)
      const now = Date.now();
      if (!lastFetch || now - lastFetch.getTime() > AUTO_REFRESH_INTERVAL) {
        fetchData(false); // silent refresh
      }
    }, AUTO_REFRESH_INTERVAL);
  }, [fetchData, lastFetch, AUTO_REFRESH_INTERVAL]);

  /** Stop auto refresh */
  const stopAutoRefresh = useCallback(() => {
    if (autoRefreshTimerRef.current) {
      clearInterval(autoRefreshTimerRef.current);
      autoRefreshTimerRef.current = null;
    }
  }, []);

  /**
   * Initial data load
   */
  useEffect(() => {
    fetchData(true);
    startAutoRefresh();
    return () => stopAutoRefresh();
  }, [fetchData, startAutoRefresh, stopAutoRefresh]);

  return {
    leads,
    teamMembers,
    loading,
    refreshing,
    error,
    lastFetch,
    refresh,
    clearCache,
    isCacheValid: isCacheValid(),
    optimisticallyAssignLeads,
    reconcileAfterBulk,
    startAutoRefresh,
    stopAutoRefresh,
  };
};
