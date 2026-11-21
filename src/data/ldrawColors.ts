export interface LDrawColor {
  id: number;
  name: string;
  hex: string;
  edgeHex: string;
  alpha: number;
  metallic?: boolean;
}

export const LDRAW_COLORS: Record<number, LDrawColor> = {
  0: { id: 0, name: 'Black', hex: '#1E2126', edgeHex: '#525964', alpha: 1 },
  1: { id: 1, name: 'Blue', hex: '#0055BF', edgeHex: '#152A4A', alpha: 1 },
  2: { id: 2, name: 'Green', hex: '#237841', edgeHex: '#123A20', alpha: 1 },
  3: { id: 3, name: 'Dark Turquoise', hex: '#008F9B', edgeHex: '#06474D', alpha: 1 },
  4: { id: 4, name: 'Red', hex: '#C91A09', edgeHex: '#5D0F07', alpha: 1 },
  5: { id: 5, name: 'Dark Pink', hex: '#C870A0', edgeHex: '#592B45', alpha: 1 },
  6: { id: 6, name: 'Brown', hex: '#583927', edgeHex: '#281910', alpha: 1 },
  7: { id: 7, name: 'Light Gray', hex: '#9BA19D', edgeHex: '#424744', alpha: 1 },
  8: { id: 8, name: 'Dark Gray', hex: '#6D6E5C', edgeHex: '#2D2E25', alpha: 1 },
  9: { id: 9, name: 'Light Blue', hex: '#B4D2E3', edgeHex: '#4D6B7D', alpha: 1 },
  10: { id: 10, name: 'Bright Green', hex: '#4B9F4A', edgeHex: '#204A20', alpha: 1 },
  14: { id: 14, name: 'Yellow', hex: '#F2CD37', edgeHex: '#7A6412', alpha: 1 },
  15: { id: 15, name: 'White', hex: '#F5F6F8', edgeHex: '#5A616C', alpha: 1 },
  16: { id: 16, name: 'Main Color', hex: '#A0A5A9', edgeHex: '#333333', alpha: 1 },
  19: { id: 19, name: 'Tan', hex: '#E4CD9E', edgeHex: '#73613F', alpha: 1 },
  22: { id: 22, name: 'Purple', hex: '#81007B', edgeHex: '#3A0038', alpha: 1 },
  25: { id: 25, name: 'Orange', hex: '#FE8A18', edgeHex: '#7D4107', alpha: 1 },
  26: { id: 26, name: 'Magenta', hex: '#923978', edgeHex: '#461838', alpha: 1 },
  27: { id: 27, name: 'Lime', hex: '#BBE90B', edgeHex: '#556B04', alpha: 1 },
  28: { id: 28, name: 'Dark Tan', hex: '#958A73', edgeHex: '#474135', alpha: 1 },
  33: { id: 33, name: 'Trans-Dark Blue', hex: '#0038A8', edgeHex: '#0B1D47', alpha: 0.58 },
  34: { id: 34, name: 'Trans-Green', hex: '#237841', edgeHex: '#133C21', alpha: 0.58 },
  36: { id: 36, name: 'Trans-Red', hex: '#C91A09', edgeHex: '#5D0F07', alpha: 0.58 },
  40: { id: 40, name: 'Trans-Black', hex: '#46505A', edgeHex: '#1C2229', alpha: 0.52 },
  41: { id: 41, name: 'Trans-Light Blue', hex: '#7FD1F5', edgeHex: '#286480', alpha: 0.55 },
  42: { id: 42, name: 'Trans-Neon Green', hex: '#C0FF00', edgeHex: '#4A6600', alpha: 0.62 },
  46: { id: 46, name: 'Trans-Yellow', hex: '#F5CD2F', edgeHex: '#7D670E', alpha: 0.6 },
  47: { id: 47, name: 'Trans-Clear', hex: '#DCE8F2', edgeHex: '#637687', alpha: 0.44 },
  57: { id: 57, name: 'Trans-Neon Orange', hex: '#FF800D', edgeHex: '#7D3C04', alpha: 0.62 },
  70: { id: 70, name: 'Reddish Brown', hex: '#582A12', edgeHex: '#261106', alpha: 1 },
  71: { id: 71, name: 'Light Bluish Gray', hex: '#A0A5A9', edgeHex: '#494E54', alpha: 1 },
  72: { id: 72, name: 'Dark Bluish Gray', hex: '#63686E', edgeHex: '#25292E', alpha: 1 },
  73: { id: 73, name: 'Medium Blue', hex: '#5A93DB', edgeHex: '#244570', alpha: 1 },
  80: { id: 80, name: 'Metallic Silver', hex: '#A5A9B4', edgeHex: '#474B54', alpha: 1, metallic: true },
  82: { id: 82, name: 'Metallic Gold', hex: '#DBAC34', edgeHex: '#6B5212', alpha: 1, metallic: true },
  85: { id: 85, name: 'Dark Purple', hex: '#3F3691', edgeHex: '#1B1647', alpha: 1 },
  154: { id: 154, name: 'New Dark Red', hex: '#720E0F', edgeHex: '#330506', alpha: 1 },
  191: { id: 191, name: 'Bright Light Orange', hex: '#F8BB3D', edgeHex: '#7D5A13', alpha: 1 },
  212: { id: 212, name: 'Bright Light Blue', hex: '#9FC3E9', edgeHex: '#426080', alpha: 1 },
  272: { id: 272, name: 'Dark Blue', hex: '#0A3463', edgeHex: '#04172E', alpha: 1 },
  288: { id: 288, name: 'Dark Green', hex: '#184632', edgeHex: '#091E15', alpha: 1 },
  297: { id: 297, name: 'Pearl Gold', hex: '#AA7F2E', edgeHex: '#4F3910', alpha: 1, metallic: true },
  308: { id: 308, name: 'Dark Brown', hex: '#352100', edgeHex: '#170E00', alpha: 1 },
  320: { id: 320, name: 'Dark Red', hex: '#720E0F', edgeHex: '#330506', alpha: 1 },
  321: { id: 321, name: 'Dark Azur', hex: '#078BC9', edgeHex: '#044363', alpha: 1 },
  322: { id: 322, name: 'Medium Azur', hex: '#36AEBF', edgeHex: '#16555E', alpha: 1 },
  323: { id: 323, name: 'Light Aqua', hex: '#ADC3C0', edgeHex: '#4F605E', alpha: 1 },
  378: { id: 378, name: 'Sand Green', hex: '#A0BCAC', edgeHex: '#465A4F', alpha: 1 },
  379: { id: 379, name: 'Sand Blue', hex: '#6074A1', edgeHex: '#2A354E', alpha: 1 },
  484: { id: 484, name: 'Dark Orange', hex: '#A95500', edgeHex: '#4C2500', alpha: 1 },
};

export function getLDrawColor(colorId: number): LDrawColor {
  return (
    LDRAW_COLORS[colorId] ?? {
      id: colorId,
      name: `Color ${colorId}`,
      hex: '#9BA19D',
      edgeHex: '#3A3E3C',
      alpha: 1,
    }
  );
}
