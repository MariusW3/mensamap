// Default configuration for Mensa layouts.
// Users can add or edit Mensen and tables in the Editor. These changes are saved in localStorage
// but can be merged back here for production.

const DEFAULT_MENSA_DATA = {
  "goettingen_zentralmensa": {
    "id": "goettingen_zentralmensa",
    "name": "Zentralmensa Göttingen",
    "viewBox": "0 0 1900 1270",
    "areas": [
      // Speisesäle / Rooms
      { "id": "area_west_1", "type": "indoor", "label": "Speisesaal West", "x": 0, "y": 700, "width": 600, "height": 350 },
      { "id": "area_west_2", "type": "indoor", "label": "", "x": 0, "y": 450, "width": 600, "height": 250 },
      { "id": "area_sued", "type": "indoor", "label": "Speisesaal Süd", "x": 600, "y": 700, "width": 600, "height": 350 },
      { "id": "area_rechts", "type": "indoor", "label": "Speisesaal Ost", "x": 1200, "y": 700, "width": 700, "height": 180 },
      { "id": "area_c", "type": "indoor", "label": "Room C", "x": 1550, "y": 30, "width": 350, "height": 670 },
      
      // Walls / Separators
      { "id": "wall_1", "type": "wall", "label": "", "x": 598, "y": 700, "width": 4, "height": 350 },
      { "id": "wall_2", "type": "wall", "label": "", "x": 1198, "y": 700, "width": 4, "height": 180 },
      { "id": "wall_3", "type": "wall", "label": "", "x": 470, "y": 700, "width": 130, "height": 8 },
      { "id": "wall_4", "type": "wall", "label": "", "x": 370, "y": 695, "width": 12, "height": 12 },
      { "id": "wall_5", "type": "wall", "label": "", "x": 220, "y": 695, "width": 12, "height": 12 },
      { "id": "wall_6", "type": "wall", "label": "", "x": 1005, "y": 1008, "width": 12, "height": 12 },
      { "id": "wall_7", "type": "wall", "label": "", "x": 805, "y": 1008, "width": 12, "height": 12 }
    ],
    "tables": [
      // Speisesaal West Tables (B-Series)
      { "id": "B-1", "x": 20, "y": 950, "width": 20, "height": 80, "shape": "rect" },
      { "id": "B-2", "x": 60, "y": 950, "width": 20, "height": 80, "shape": "rect" },
      { "id": "B-3", "x": 100, "y": 950, "width": 20, "height": 80, "shape": "rect" },
      { "id": "B-4", "x": 140, "y": 950, "width": 20, "height": 80, "shape": "rect" },
      { "id": "B-5", "x": 180, "y": 950, "width": 20, "height": 80, "shape": "rect" },
      { "id": "B-6", "x": 220, "y": 950, "width": 20, "height": 80, "shape": "rect" },
      { "id": "B-7", "x": 260, "y": 950, "width": 20, "height": 80, "shape": "rect" },
      { "id": "B-8", "x": 300, "y": 950, "width": 20, "height": 80, "shape": "rect" },
      { "id": "B-9", "x": 340, "y": 950, "width": 20, "height": 80, "shape": "rect" },
      { "id": "B-10", "x": 380, "y": 950, "width": 20, "height": 80, "shape": "rect" },
      { "id": "B-11", "x": 420, "y": 950, "width": 20, "height": 80, "shape": "rect" },
      { "id": "B-12", "x": 460, "y": 950, "width": 20, "height": 80, "shape": "rect" },
      
      { "id": "B-13", "x": 300, "y": 780, "width": 20, "height": 100, "shape": "rect" },
      { "id": "B-14", "x": 340, "y": 780, "width": 20, "height": 100, "shape": "rect" },
      { "id": "B-15", "x": 380, "y": 780, "width": 20, "height": 100, "shape": "rect" },
      { "id": "B-16", "x": 420, "y": 780, "width": 20, "height": 100, "shape": "rect" },
      { "id": "B-17", "x": 460, "y": 780, "width": 20, "height": 100, "shape": "rect" },
      
      { "id": "B-18", "x": 20, "y": 700, "width": 80, "height": 20, "shape": "rect" },
      { "id": "B-19", "x": 20, "y": 760, "width": 80, "height": 20, "shape": "rect" },
      { "id": "B-20", "x": 20, "y": 820, "width": 80, "height": 20, "shape": "rect" },
      { "id": "B-21", "x": 20, "y": 880, "width": 80, "height": 20, "shape": "rect" },
      
      { "id": "B-23", "x": 150, "y": 760, "width": 80, "height": 20, "shape": "rect" },
      { "id": "B-24", "x": 150, "y": 820, "width": 80, "height": 20, "shape": "rect" },
      { "id": "B-25", "x": 150, "y": 880, "width": 80, "height": 20, "shape": "rect" },
      
      { "id": "B-26", "x": 20, "y": 640, "width": 100, "height": 20, "shape": "rect" },
      { "id": "B-27", "x": 20, "y": 600, "width": 100, "height": 20, "shape": "rect" },
      { "id": "B-28", "x": 20, "y": 560, "width": 100, "height": 20, "shape": "rect" },
      { "id": "B-29", "x": 20, "y": 520, "width": 100, "height": 20, "shape": "rect" },
      
      { "id": "B-30", "x": 170, "y": 640, "width": 100, "height": 20, "shape": "rect" },
      { "id": "B-31", "x": 170, "y": 600, "width": 100, "height": 20, "shape": "rect" },
      { "id": "B-32", "x": 170, "y": 560, "width": 100, "height": 20, "shape": "rect" },
      { "id": "B-33", "x": 170, "y": 520, "width": 100, "height": 20, "shape": "rect" },
      
      { "id": "B-34", "x": 300, "y": 640, "width": 100, "height": 20, "shape": "rect" },
      { "id": "B-35", "x": 300, "y": 600, "width": 100, "height": 20, "shape": "rect" },
      { "id": "B-36", "x": 300, "y": 560, "width": 100, "height": 20, "shape": "rect" },
      { "id": "B-37", "x": 300, "y": 520, "width": 100, "height": 20, "shape": "rect" },
      
      { "id": "B-38", "x": 470, "y": 660, "width": 100, "height": 20, "shape": "rect" },
      { "id": "B-39", "x": 470, "y": 620, "width": 100, "height": 20, "shape": "rect" },
      { "id": "B-40", "x": 470, "y": 580, "width": 100, "height": 20, "shape": "rect" },
      { "id": "B-41", "x": 470, "y": 540, "width": 100, "height": 20, "shape": "rect" },
      { "id": "B-42", "x": 470, "y": 500, "width": 100, "height": 20, "shape": "rect" },
      
      { "id": "B-43", "x": 320, "y": 690, "width": 40, "height": 20, "shape": "rect" },
      { "id": "B-44", "x": 240, "y": 690, "width": 40, "height": 20, "shape": "rect" },
      { "id": "B-45", "x": 170, "y": 690, "width": 40, "height": 20, "shape": "rect" },
      { "id": "B-46", "x": 240, "y": 460, "width": 20, "height": 30, "shape": "rect" },
      { "id": "B-47", "x": 300, "y": 460, "width": 20, "height": 30, "shape": "rect" },
      { "id": "B-48", "x": 360, "y": 460, "width": 20, "height": 30, "shape": "rect" },

      // Speisesaal Süd Tables (A-Series)
      { "id": "A-1", "x": 750, "y": 850, "width": 60, "height": 20, "shape": "rect" },
      { "id": "A-2", "x": 700, "y": 890, "width": 110, "height": 20, "shape": "rect" },
      { "id": "A-3", "x": 700, "y": 930, "width": 110, "height": 20, "shape": "rect" },
      { "id": "A-4", "x": 700, "y": 970, "width": 110, "height": 20, "shape": "rect" },
      
      { "id": "A-5", "x": 850, "y": 890, "width": 110, "height": 20, "shape": "rect" },
      { "id": "A-6", "x": 850, "y": 930, "width": 110, "height": 20, "shape": "rect" },
      { "id": "A-7", "x": 850, "y": 970, "width": 110, "height": 20, "shape": "rect" },
      
      { "id": "A-8", "x": 1020, "y": 890, "width": 110, "height": 20, "shape": "rect" },
      { "id": "A-9", "x": 1020, "y": 930, "width": 110, "height": 20, "shape": "rect" },
      { "id": "A-10", "x": 1020, "y": 970, "width": 110, "height": 20, "shape": "rect" },
      
      { "id": "A-11", "x": 1170, "y": 890, "width": 20, "height": 30, "shape": "rect" },
      { "id": "A-12", "x": 1170, "y": 930, "width": 20, "height": 30, "shape": "rect" },
      { "id": "A-13", "x": 1170, "y": 970, "width": 20, "height": 30, "shape": "rect" },
      { "id": "A-14", "x": 1170, "y": 1010, "width": 20, "height": 30, "shape": "rect" },
      
      { "id": "A-15", "x": 1100, "y": 1010, "width": 20, "height": 40, "shape": "rect" },
      { "id": "A-16", "x": 1050, "y": 1010, "width": 20, "height": 40, "shape": "rect" },
      { "id": "A-17", "x": 1000, "y": 1025, "width": 20, "height": 25, "shape": "rect" },
      { "id": "A-18", "x": 960, "y": 1010, "width": 20, "height": 40, "shape": "rect" },
      { "id": "A-19", "x": 920, "y": 1010, "width": 20, "height": 40, "shape": "rect" },
      { "id": "A-20", "x": 880, "y": 1010, "width": 20, "height": 40, "shape": "rect" },
      { "id": "A-21", "x": 800, "y": 1025, "width": 20, "height": 25, "shape": "rect" },
      { "id": "A-22", "x": 760, "y": 1010, "width": 20, "height": 40, "shape": "rect" },
      { "id": "A-23", "x": 720, "y": 1010, "width": 20, "height": 40, "shape": "rect" },
      { "id": "A-24", "x": 680, "y": 1010, "width": 20, "height": 40, "shape": "rect" }
    ]
  }
};
