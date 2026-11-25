// Ambient declarations for React Native and Expo packages used in mobile app
declare module 'react-native' {
  export const View: any;
  export const Text: any;
  export const StyleSheet: any;
  export const TouchableOpacity: any;
  export const ScrollView: any;
  export const TextInput: any;
  export const Image: any;
  export const ActivityIndicator: any;
  export const SafeAreaView: any;
  export const StatusBar: any;
  export const Alert: any;
  export const Dimensions: any;
  export const Platform: any;
  export const Modal: any;
  export const Pressable: any;
  export const FlatList: any;
  export const KeyboardAvoidingView: any;
  export const Linking: any;
  export const RefreshControl: any;
  export type ViewStyle = any;
  export type TextStyle = any;
  export type ImageStyle = any;
  export type StyleProp<T> = any;
}

declare module 'react-native-svg' {
  export const Svg: any;
  export const Circle: any;
  export const Path: any;
  export const G: any;
  export const Defs: any;
  export const LinearGradient: any;
  export const Stop: any;
  export default Svg;
}

declare module 'expo-status-bar' {
  export const StatusBar: any;
}

declare module '@react-native-async-storage/async-storage' {
  const AsyncStorage: {
    getItem: (key: string) => Promise<string | null>;
    setItem: (key: string, value: string) => Promise<void>;
    removeItem: (key: string) => Promise<void>;
    clear: () => Promise<void>;
  };
  export default AsyncStorage;
}

declare module 'lucide-react-native' {
  export const Sparkles: any;
  export const Flame: any;
  export const Award: any;
  export const Clock: any;
  export const ArrowRight: any;
  export const Play: any;
  export const CheckCircle: any;
  export const CheckCircle2: any;
  export const BookOpen: any;
  export const Video: any;
  export const FileText: any;
  export const Briefcase: any;
  export const Users: any;
  export const Home: any;
  export const Bot: any;
  export const ChevronRight: any;
  export const LogOut: any;
  export const RefreshCw: any;
  export const AlertCircle: any;
  export const User: any;
  export const Shield: any;
  export const Calendar: any;
  export const Target: any;
  export const GraduationCap: any;
  export const Search: any;
  export const MapPin: any;
  export const DollarSign: any;
  export const ExternalLink: any;
  export const Send: any;
  export const MessageSquare: any;
}
