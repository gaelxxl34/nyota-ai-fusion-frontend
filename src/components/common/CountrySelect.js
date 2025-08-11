import React from "react";

// Countries list with flags - matching student portal format exactly
export const COUNTRIES = [
  // East African Countries (Priority for IUEA)
  "🇺🇬 Uganda",
  "🇰🇪 Kenya",
  "🇹🇿 Tanzania",
  "🇷🇼 Rwanda",
  "🇧🇮 Burundi",
  "🇸🇸 South Sudan",
  "🇪🇹 Ethiopia",
  "🇸🇴 Somalia",
  "🇪🇷 Eritrea",
  "🇩🇯 Djibouti",

  // Other African Countries
  "🇳🇬 Nigeria",
  "🇬🇭 Ghana",
  "🇿🇦 South Africa",
  "🇪🇬 Egypt",
  "🇲🇦 Morocco",
  "🇹🇳 Tunisia",
  "🇩🇿 Algeria",
  "🇱🇾 Libya",
  "🇸🇩 Sudan",
  "🇹🇩 Chad",
  "🇨🇫 Central African Republic",
  "🇨🇩 Democratic Republic of Congo",
  "🇨🇬 Republic of Congo",
  "🇨🇲 Cameroon",
  "🇬🇦 Gabon",
  "🇬🇶 Equatorial Guinea",
  "🇸🇹 São Tomé and Príncipe",
  "🇦🇴 Angola",
  "🇿🇲 Zambia",
  "🇲🇼 Malawi",
  "🇲🇿 Mozambique",
  "🇿🇼 Zimbabwe",
  "🇧🇼 Botswana",
  "🇳🇦 Namibia",
  "🇱🇸 Lesotho",
  "🇸🇿 Eswatini",
  "🇲🇬 Madagascar",
  "🇲🇺 Mauritius",
  "🇸🇨 Seychelles",
  "🇰🇲 Comoros",
  "🇲🇱 Mali",
  "🇧🇫 Burkina Faso",
  "🇳🇪 Niger",
  "🇸🇳 Senegal",
  "🇬🇲 Gambia",
  "🇬🇼 Guinea-Bissau",
  "🇬🇳 Guinea",
  "🇸🇱 Sierra Leone",
  "🇱🇷 Liberia",
  "🇨🇮 Côte d'Ivoire",
  "🇹🇬 Togo",
  "🇧🇯 Benin",
  "🇨🇻 Cape Verde",

  // Popular International Destinations
  "🇺🇸 United States",
  "🇬🇧 United Kingdom",
  "🇨🇦 Canada",
  "🇦🇺 Australia",
  "🇩🇪 Germany",
  "🇫🇷 France",
  "🇳🇱 Netherlands",
  "🇧🇪 Belgium",
  "🇨🇭 Switzerland",
  "🇦🇹 Austria",
  "🇮🇹 Italy",
  "🇪🇸 Spain",
  "🇵🇹 Portugal",
  "🇸🇪 Sweden",
  "🇳🇴 Norway",
  "🇩🇰 Denmark",
  "🇫🇮 Finland",
  "🇮🇪 Ireland",
  "🇳🇿 New Zealand",

  // Asian Countries
  "🇨🇳 China",
  "🇮🇳 India",
  "🇯🇵 Japan",
  "🇰🇷 South Korea",
  "🇸🇬 Singapore",
  "🇲🇾 Malaysia",
  "🇹🇭 Thailand",
  "🇵🇭 Philippines",
  "🇮🇩 Indonesia",
  "🇻🇳 Vietnam",
  "🇵🇰 Pakistan",
  "🇧🇩 Bangladesh",
  "🇱🇰 Sri Lanka",
  "🇦🇫 Afghanistan",
  "🇮🇷 Iran",
  "🇮🇶 Iraq",
  "🇹🇷 Turkey",
  "🇸🇦 Saudi Arabia",
  "🇦🇪 United Arab Emirates",
  "🇶🇦 Qatar",
  "🇰🇼 Kuwait",
  "🇧🇭 Bahrain",
  "🇴🇲 Oman",
  "🇾🇪 Yemen",
  "🇯🇴 Jordan",
  "🇱🇧 Lebanon",
  "🇸🇾 Syria",
  "🇮🇱 Israel",
  "🇵🇸 Palestine",

  // South American Countries
  "🇧🇷 Brazil",
  "🇦🇷 Argentina",
  "🇨🇱 Chile",
  "🇨🇴 Colombia",
  "🇵🇪 Peru",
  "🇻🇪 Venezuela",
  "🇪🇨 Ecuador",
  "🇧🇴 Bolivia",
  "🇵🇾 Paraguay",
  "🇺🇾 Uruguay",
  "🇬🇾 Guyana",
  "🇸🇷 Suriname",

  // Other European Countries
  "🇷🇺 Russia",
  "🇵🇱 Poland",
  "🇨🇿 Czech Republic",
  "🇸🇰 Slovakia",
  "🇭🇺 Hungary",
  "🇷🇴 Romania",
  "🇧🇬 Bulgaria",
  "🇬🇷 Greece",
  "🇭🇷 Croatia",
  "🇷🇸 Serbia",
  "🇧🇦 Bosnia and Herzegovina",
  "🇲🇪 Montenegro",
  "🇲🇰 North Macedonia",
  "🇦🇱 Albania",
  "🇸🇮 Slovenia",
  "🇪🇪 Estonia",
  "🇱🇻 Latvia",
  "🇱🇹 Lithuania",
  "🇧🇾 Belarus",
  "🇺🇦 Ukraine",
  "🇲🇩 Moldova",

  // Other Countries
  "🇲🇽 Mexico",
  "🇯🇲 Jamaica",
  "🇨🇺 Cuba",
  "🇭🇹 Haiti",
  "🇩🇴 Dominican Republic",
  "🇵🇷 Puerto Rico",
  "🇹🇹 Trinidad and Tobago",
  "🇧🇧 Barbados",
  "🇫🇯 Fiji",
  "🇵🇬 Papua New Guinea",
  "🇸🇧 Solomon Islands",
  "🇻🇺 Vanuatu",
  "🇼🇸 Samoa",
  "🇹🇴 Tonga",
  "🇫🇲 Micronesia",
  "🇵🇼 Palau",
  "🇲🇭 Marshall Islands",
  "🇰🇮 Kiribati",
  "🇹🇻 Tuvalu",
  "🇳🇷 Nauru",
].sort();

const CountrySelect = ({
  value,
  onChange,
  disabled = false,
  className = "",
}) => {
  return (
    <select
      value={value || ""}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent ${className}`}
    >
      <option value="">Select Country</option>
      {COUNTRIES.map((country) => (
        <option key={country} value={country}>
          {country}
        </option>
      ))}
    </select>
  );
};

export default CountrySelect;
