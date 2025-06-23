export interface Wine {
  id: string;
  name: string;
  winery: string;
  region: string;
  price: number;
  rating: number;
  foodPairing: string;
  alcoholPercentage: number;
  description: string;
  wineImageName: string;
  type: 'red' | 'white';
  url?: string;
}

export interface User {
  id: string;
  username: string;
  email: string;
  password: string;
}

export interface SavedWine extends Wine {
  dateSaved: string;
  dateTried?: string;
  userRating?: number;
  userNotes?: string;
}

export interface CommunityPost {
  id: string;
  username: string;
  content: string;
  wineId?: string;
  wineName?: string;
  winery?: string;
  likes: number;
  comments: Comment[];
  timestamp: string;
  isLiked: boolean;
}

export interface Comment {
  id: string;
  username: string;
  content: string;
  timestamp: string;
}