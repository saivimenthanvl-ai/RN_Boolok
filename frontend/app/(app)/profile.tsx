import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  Pressable,
  TouchableOpacity,
  Platform,
  TextInput,
  useWindowDimensions,
  ActivityIndicator,
  Alert,
  Modal,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { spacing, typography, radius } from '../../constants/theme';
import LoadingScreen from '../../components/LoadingScreen';
import { LinearGradient } from 'expo-linear-gradient';
import BoolokLogo from '../../components/BoolokLogo';
import { useVideoPlayer, VideoView } from 'expo-video';
import { API_BASE_URL } from '../../lib/api';

// ── Shared follow tracker ───────────────────────────────────────────────────
const GLOBAL_FOLLOWED_USERS = new Set<string>();

const UserAvatar = ({ user, size = 40, style }: { user?: any; size?: number; style?: any }) => {
  const photo = user?.profilePicture || user?.avatar;
  const name = user?.fullName || user?.username || 'User';
  const initial = name[0]?.toUpperCase() || 'U';

  if (photo && typeof photo === 'string' && photo.trim()) {
    const uri = photo.startsWith('http') || photo.startsWith('data:')
      ? photo
      : `${API_BASE_URL}${photo}`;
    return (
      <Image
        source={{ uri }}
        style={[{ width: size, height: size, borderRadius: size / 2 }, style]}
        resizeMode="cover"
      />
    );
  }

  return (
    <View
      style={[
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: '#162338',
          justifyContent: 'center',
          alignItems: 'center',
          borderWidth: 1.5,
          borderColor: '#daa520',
        },
        style,
      ]}
    >
      <Text style={{ color: '#daa520', fontWeight: '800', fontSize: size * 0.42 }}>
        {initial}
      </Text>
    </View>
  );
};

const COMMUNITY_MEMBERS = [
  {
    id: 'shreekutti',
    _id: 'shreekutti',
    fullName: 'shreekutti',
    username: 'shreekutti',
    headline: 'Commercial Property & Tech Park Portfolio Lead @ Boolok Realty',
    location: 'Chennai, Tamilnadu · Tech Parks',
    bio: 'Specialized in commercial land development, Grade-A tech hub transactions, and IT SEZ acquisitions across South India.',
    closedDeals: '12',
    profilePicture: null,
    coverImage: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1200',
    reels: [
      {
        _id: 'shree-reel-1',
        title: 'Bangalore Tech Park Campus',
        location: 'Outer Ring Road, Bangalore',
        aiMatch: 99,
        insight: 'Grade-A LEED Platinum tech park with 94% occupancy and 8.6% cap rate.',
        likes: 3120,
        poster: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1200',
        thumbnail: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1200',
        videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4',
        comments: [
          { _id: 'sc-1', user: { fullName: 'Logeshwaran A' }, text: '8.6% cap rate on ORR is top quartile performance! 🏢🚀', createdAt: new Date() },
          { _id: 'sc-2', user: { fullName: 'Akshat Commercials' }, text: 'Strong institutional covenants on this campus.', createdAt: new Date() },
        ],
      },
    ],
    posts: [
      {
        _id: 'shree-p-1',
        title: 'Grade-A Commercial IT Campus',
        price: '$42,000,000',
        location: 'Bangalore, Karnataka',
        specs: '92,000 sq ft · 8.4% Cap Rate',
        content: 'Fully leased Grade-A Tech Park development with pre-verified institutional efficiency ratings.',
        image: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1200',
        mediaUrl: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1200',
        likesCount: 142,
        commentsCount: 18,
      },
    ],
  },
  {
    id: '6a8af34812ef34aed25ae8d2',
    _id: '6a8af34812ef34aed25ae8d2',
    fullName: 'Logeshwaran A',
    username: 'logeshwarana',
    headline: 'Architectural Consultant & Real Estate Lead',
    location: 'Western Australia · Vineyard Estates',
    bio: 'Focused on precision cap-rate calculations, commercial yield optimization, and real estate investment portfolios.',
    closedDeals: '18',
    followerCount: 1,
    followingCount: 1,
    mutuals: 'Followed by Sai',
    profilePicture: 'https://lh3.googleusercontent.com/a/ACg8ocJ_TV7-lpSTfRAQI0wc76yPHoIWaWg_5lgW-i9RxbiPx4tlFk0r=s96-c',
    coverImage: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200',
    reels: [
      {
        _id: 'logesh-reel-1',
        title: 'Margaret River Vineyard',
        location: 'Western Australia',
        aiMatch: 98,
        insight: 'Soil analysis indicates 92% suitability for premium Cabernet Sauvignon. Water rights pre-verified for 50 years.',
        likes: 2400,
        poster: 'https://images.unsplash.com/photo-1506377247377-2a5b3b417ebb?w=1200',
        thumbnail: 'https://images.unsplash.com/photo-1506377247377-2a5b3b417ebb?w=1200',
        videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
        comments: [
          { _id: 'c1-1', user: { fullName: 'Shreekutti' }, text: 'The terroir and climate suitability metrics are exceptional here! 🍇✨', createdAt: new Date() },
          { _id: 'c1-2', user: { fullName: 'Mohammed Ajmal' }, text: '50-year pre-verified water rights make this a bulletproof acquisition. 🍷', createdAt: new Date() },
        ],
      },
      {
        _id: 'logesh-reel-2',
        title: 'Kyoto Forest Retreat',
        location: 'Kyoto, Japan',
        aiMatch: 95,
        insight: 'Thermal zoning optimized. High potential for eco-luxury cabins or a private wellness estate.',
        likes: 920,
        poster: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=1200',
        thumbnail: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=1200',
        videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4',
        comments: [
          { _id: 'c2-1', user: { fullName: 'Mohammed Ajmal' }, text: 'Thermal zoning and serene forested topography are hard to find in Kyoto! ⛩️🍃', createdAt: new Date() },
        ],
      },
    ],
    posts: [
      {
        _id: 'logesh-p-1',
        title: 'Margaret River Commercial Vineyard',
        price: '$18,500,000',
        location: 'Western Australia',
        specs: '140 Acres · Pre-Verified Water Rights',
        content: 'World-class vineyard estate with high soil suitability index and pre-approved zoning.',
        image: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1200',
        mediaUrl: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1200',
        likesCount: 98,
        commentsCount: 12,
      },
    ],
  },
  {
    id: 'ajmal',
    _id: 'ajmal',
    fullName: 'Mohammed Ajmal',
    username: 'mohammedajmal',
    headline: 'Luxury Living & High-End Residential Broker',
    location: 'Dubai · Luxury Villas',
    bio: 'Connecting international investors to premier waterfront villas and bespoke residential developments.',
    closedDeals: '9',
    profilePicture: null,
    coverImage: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=1200',
    reels: [
      {
        _id: 'ajmal-reel-1',
        title: 'Palm Jumeirah Signature Villa',
        location: 'Dubai, UAE',
        aiMatch: 96,
        insight: 'Private beachfront with panoramic Dubai Marina skyline views.',
        likes: 4200,
        poster: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=1200',
        thumbnail: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=1200',
        videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
        comments: [
          { _id: 'ac-1', user: { fullName: 'Shreekutti' }, text: 'Unmatched beachfront elevation and bespoke finishes! 🏖️✨', createdAt: new Date() },
        ],
      },
    ],
    posts: [
      {
        _id: 'ajmal-p-1',
        title: 'Waterfront Palm Signature Mansion',
        price: '$24,000,000',
        location: 'Palm Jumeirah, Dubai',
        specs: '7 Beds · 9 Baths · Private Beach',
        content: 'Direct beach access, smart home automation, infinity pool overlooking Dubai Marina.',
        image: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=1200',
        mediaUrl: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=1200',
        likesCount: 215,
        commentsCount: 31,
      },
    ],
  },
  {
    id: 'bavadharini_rs',
    _id: 'bavadharini_rs',
    fullName: 'Bavadharini RS',
    username: 'bavadharini_rs',
    headline: 'Interior Designer & Modern Living Specialist',
    location: 'Chennai, Tamil Nadu · Modern Living',
    bio: 'Bespoke high-end interior architecture, penthouse makeovers, and custom luxury styling.',
    closedDeals: '14',
    profilePicture: null,
    coverImage: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=1200',
    reels: [
      {
        _id: 'bava-reel-1',
        title: 'Minimalist Penthouse Renovation',
        location: 'Poes Garden, Chennai',
        aiMatch: 97,
        insight: 'Italian marble integration with customized circadian acoustic lighting.',
        likes: 1850,
        poster: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=1200',
        thumbnail: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=1200',
        videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
        comments: [
          { _id: 'bc-1', user: { fullName: 'Akshat Commercials' }, text: 'Incredible acoustic zoning and clean lines! 🌿', createdAt: new Date() },
        ],
      },
    ],
    posts: [
      {
        _id: 'bava-p-1',
        title: 'High-Ceiling Ultra Penthouse',
        price: '$6,200,000',
        location: 'Chennai, Tamil Nadu',
        specs: '5,800 sq ft · Private Elevator',
        content: 'Double-height glass living room, customized Italian joinery, panoramic sea view balcony.',
        image: 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=1200',
        mediaUrl: 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=1200',
        likesCount: 164,
        commentsCount: 22,
      },
    ],
  },
  {
    id: 'the_akshtr_estate',
    _id: 'the_akshtr_estate',
    fullName: 'Akshat Commercials',
    username: 'the_akshtr_estate',
    headline: 'Commercial Property & Tech Park Portfolio Lead @ Boolok Network',
    location: 'Chennai, Tamil Nadu · Prime Assets',
    bio: 'Specializing in Grade-A IT SEZ parks, commercial lease syndications, and institutional asset acquisitions on OMR Chennai.',
    closedDeals: '21',
    profilePicture: null,
    coverImage: 'https://images.unsplash.com/photo-1577495508048-b635879837f1?w=1200',
    reels: [
      {
        _id: 'akshat-reel-1',
        title: 'OMR Cyber Park Tower B',
        location: 'OMR, Chennai',
        aiMatch: 95,
        insight: 'Pre-leased to Fortune 500 tech tenant on a 9-year triple net lease.',
        likes: 2900,
        poster: 'https://images.unsplash.com/photo-1577495508048-b635879837f1?w=1200',
        thumbnail: 'https://images.unsplash.com/photo-1577495508048-b635879837f1?w=1200',
        videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4',
        comments: [
          { _id: 'akc-1', user: { fullName: 'Logeshwaran A' }, text: 'Triple net lease with institutional covenants is top tier! 🏢', createdAt: new Date() },
        ],
      },
    ],
    posts: [
      {
        _id: 'akshat-p-1',
        title: 'Institutional Grade-A Office Hub',
        price: '$35,000,000',
        location: 'OMR IT Corridor, Chennai',
        specs: '120,000 sq ft · 8.9% Yield',
        content: 'Modern commercial tower with multi-level parking, 100% power backup, and prime expressway frontage.',
        image: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=1200',
        mediaUrl: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=1200',
        likesCount: 188,
        commentsCount: 26,
      },
    ],
  },
  {
    id: 'prasanth_properties',
    _id: 'prasanth_properties',
    fullName: 'Prasanth Properties',
    username: 'prasanth_properties',
    headline: 'Luxury Waterfront Specialist · Miami & Coastal Estates',
    location: 'Miami, Florida · Coastal Estates',
    bio: 'Luxury real estate advisory focused on ultra-prime beachfront residences and waterfront villas.',
    closedDeals: '8',
    profilePicture: null,
    coverImage: 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=1200',
    reels: [
      {
        _id: 'prasanth-reel-1',
        title: 'Star Island Waterfront Estate',
        location: 'Miami Beach, Florida',
        aiMatch: 98,
        insight: 'Deepwater dock with direct ocean access, accommodating 120ft mega yachts.',
        likes: 3800,
        poster: 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=1200',
        thumbnail: 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=1200',
        videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
        comments: [
          { _id: 'pc-1', user: { fullName: 'Mohammed Ajmal' }, text: 'Deepwater dock specs and yacht clearance are remarkable. 🛥️🌊', createdAt: new Date() },
        ],
      },
    ],
    posts: [
      {
        _id: 'prasanth-p-1',
        title: 'Star Island Waterfront Estate',
        price: '$19,800,000',
        location: 'Miami Beach, Florida',
        specs: '6 Beds · 8 Baths · Private Mega-Yacht Dock',
        content: 'Bespoke modern architecture with floor-to-ceiling glass, sunset views, and private yacht slip.',
        image: 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=1200',
        mediaUrl: 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=1200',
        likesCount: 290,
        commentsCount: 44,
      },
    ],
  },
];

const resolvePropertyImage = (post: any) => {
  const url = post?.mediaUrl || post?.image || post?.mediaUrls?.[0];
  if (url && typeof url === 'string' && url.trim()) {
    if (url.startsWith('http') || url.startsWith('data:')) return url;
    return `${process.env.EXPO_PUBLIC_API_URL}${url}`;
  }
  const loc = (post?.location || '').toLowerCase();
  const title = (post?.title || '').toLowerCase();
  if (loc.includes('bangalore') || title.includes('it campus') || title.includes('tech park')) {
    return 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1200';
  }
  if (loc.includes('dubai') || loc.includes('palm') || title.includes('palm')) {
    return 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=1200';
  }
  if (loc.includes('omr') || loc.includes('commercial') || title.includes('office')) {
    return 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=1200';
  }
  if (loc.includes('penthouse') || loc.includes('poes') || title.includes('penthouse')) {
    return 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=1200';
  }
  if (loc.includes('miami') || loc.includes('star island') || title.includes('star island')) {
    return 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=1200';
  }
  if (loc.includes('coventry') || loc.includes('united kingdom') || loc.includes('london')) {
    return 'https://images.unsplash.com/photo-1577495508048-b635879837f1?w=1200';
  }
  return 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1200';
};

const SAI_REELS = [
  {
    _id: 'sai-reel-coventry',
    title: 'Coventry Office',
    location: 'Coventry, United Kingdom',
    aiMatch: 97,
    insight: 'Strong engagement expected based on similar recent listings.',
    likes: 0,
    poster: 'https://images.unsplash.com/photo-1613977257363-707ba9348227?w=1200',
    thumbnail: 'https://images.unsplash.com/photo-1613977257363-707ba9348227?w=1200',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    comments: [
      { _id: 'c4-1', user: { fullName: 'Logeshwaran A' }, text: 'Grade-A office specs with strong institutional tenant appeal. 🏢💼', createdAt: new Date() },
      { _id: 'c4-2', user: { fullName: 'Shreekutti' }, text: 'High floor efficiency and convenient transit access. 🚆', createdAt: new Date() },
    ],
  },
];

function resolveMemberProfile(targetId: string, viewer: any) {
  const norm = (targetId || '').trim().toLowerCase();
  const viewerUsername = (viewer?.username || '').toLowerCase();
  const viewerId = (viewer?.id || viewer?._id || '').toLowerCase();

  const isViewer =
    !norm ||
    norm === 'self' ||
    norm === viewerId ||
    (Boolean(viewerUsername) && norm === viewerUsername);

  if (isViewer) {
    return {
      id: viewer?.id || viewer?._id || 'self',
      _id: viewer?.id || viewer?._id || 'self',
      fullName: viewer?.fullName || 'Sai Vimenthan',
      username: viewer?.username || 'saivimenthanvl',
      headline: viewer?.headline || 'Elite Real Estate Broker & Commercial Portfolio Lead',
      location: viewer?.location || 'Chennai, Tamil Nadu · Prime Assets',
      bio: viewer?.bio || 'Real estate professional and advisor on the Boolok AI network.',
      profilePicture: viewer?.profilePicture || 'https://lh3.googleusercontent.com/a/ACg8ocK0o5SZUMa-JTOuTUTxS6t1Bl20HPwVkbFAz98dCG6e1rbpGA=s96-c',
      coverImage: viewer?.coverImage || 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200',
      closedDeals: viewer?.closedDeals || '12',
      followerCount: 4,
      followingCount: 4,
      mutuals: '4 followers in Boolok Real Estate Network',
      reels: SAI_REELS,
      posts: [
        {
          _id: 'sai-p-1',
          title: 'Coventry Corporate Headquarters',
          price: '$16,500,000',
          location: 'Coventry, United Kingdom',
          specs: '52,000 sq ft · 8.2% Cap Rate',
          content: 'Grade-A institutional office headquarters with 100% occupancy and blue-chip covenants.',
          image: 'https://images.unsplash.com/photo-1577495508048-b635879837f1?w=1200',
          mediaUrl: 'https://images.unsplash.com/photo-1577495508048-b635879837f1?w=1200',
          likesCount: 104,
          commentsCount: 14,
        },
      ],
    };
  }

  const found = COMMUNITY_MEMBERS.find(
    (m) =>
      m.id.toLowerCase() === norm ||
      m.username.toLowerCase() === norm ||
      m.fullName.toLowerCase() === norm
  );

  if (found) {
    return found;
  }

  const cleanName = targetId.replace(/[._]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  return {
    id: targetId,
    _id: targetId,
    fullName: cleanName,
    username: targetId.toLowerCase(),
    headline: 'Certified Real Estate Advisor @ Boolok Network',
    location: 'Chennai, Tamil Nadu · Prime Assets',
    bio: 'Real estate professional and certified portfolio advisor on the Boolok AI network.',
    profilePicture: null,
    coverImage: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200',
    closedDeals: '0',
    mutuals: '',
    reels: [],
    posts: [],
  };
}

const ProfileReelItem = ({ reel }: { reel: any }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [likesCount, setLikesCount] = useState<number>(reel.likes?.length ?? reel.likes ?? 100);
  const [hasLiked, setHasLiked] = useState(false);
  const [comments, setComments] = useState<any[]>(reel.comments || [
    { _id: 'c1', user: { fullName: 'Logeshwaran A' }, text: 'Incredible property location and zoning potential! 🏢✨', createdAt: new Date() },
    { _id: 'c2', user: { fullName: 'Bavadharini RS' }, text: 'The architectural design and layout looks world class. 🌿', createdAt: new Date() },
  ]);
  const [showComments, setShowComments] = useState(false);
  const [commentInput, setCommentInput] = useState('');

  const videoSource = reel.videoUrl || 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4';
  const videoRef = useRef<any>(null);

  const player = useVideoPlayer(videoSource, (p) => {
    p.loop = true;
    p.muted = false;
  });

  const togglePlay = () => {
    if (Platform.OS === 'web' && videoRef.current) {
      const vid = videoRef.current;
      if (vid.paused) {
        vid.muted = true;
        const p = vid.play();
        if (p !== undefined) {
          p.then(() => {
            setIsPlaying(true);
            try { vid.muted = false; } catch (_) { }
          }).catch(() => {
            vid.muted = true;
            vid.load();
            vid.play().then(() => setIsPlaying(true)).catch(() => { });
          });
        }
      } else {
        vid.pause();
        setIsPlaying(false);
      }
      return;
    }

    if (player) {
      if (player.playing) {
        player.pause();
        setIsPlaying(false);
      } else {
        player.play();
        setIsPlaying(true);
      }
    }
  };

  const handleLike = () => {
    if (hasLiked) {
      setHasLiked(false);
      setLikesCount((prev) => Math.max(0, prev - 1));
    } else {
      setHasLiked(true);
      setLikesCount((prev) => prev + 1);
    }
  };

  const handleAddComment = () => {
    if (!commentInput.trim()) return;
    const newC = {
      _id: Date.now().toString(),
      user: { fullName: 'You' },
      text: commentInput.trim(),
      createdAt: new Date(),
    };
    setComments((prev) => [...prev, newC]);
    setCommentInput('');
  };

  return (
    <View style={styles.reelCardItem}>
      {/* ── Video Player / Fallback ── */}
      <Pressable onPress={togglePlay} style={StyleSheet.absoluteFill}>
        {Platform.OS === 'web' ? (
          <video
            ref={videoRef}
            src={videoSource}
            poster={reel.thumbnail || reel.poster}
            loop
            preload="metadata"
            playsInline
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              position: 'absolute',
              top: 0,
              left: 0,
              pointerEvents: 'none',
              backgroundColor: '#000000',
            }}
          />
        ) : (
          <>
            {(reel.thumbnail || reel.poster) && !isPlaying && (
              <Image
                source={{ uri: reel.thumbnail || reel.poster }}
                style={StyleSheet.absoluteFill}
                resizeMode="cover"
              />
            )}
            <VideoView
              player={player}
              style={StyleSheet.absoluteFill}
              contentFit="cover"
              nativeControls={false}
            />
          </>
        )}

        {!isPlaying && (
          <View style={styles.centerPlayOverlay} pointerEvents="none">
            <View style={styles.playIconCircle}>
              <MaterialIcons name="play-arrow" size={36} color="#e6b800" />
            </View>
          </View>
        )}
      </Pressable>

      {/* ── Top Overlay: AI Match Score ── */}
      <View style={styles.reelMatchBadge} pointerEvents="none">
        <View style={styles.reelMatchDot} />
        <Text style={styles.reelMatchText}>{reel.aiMatch || 95}% AI MATCH</Text>
      </View>

      {/* ── Right Action Sidebar (Like, Comment, Share) ── */}
      <View style={styles.reelRightActions} pointerEvents="box-none">
        {/* Like Button */}
        <TouchableOpacity
          onPress={handleLike}
          activeOpacity={0.7}
          style={styles.reelActionBtn}
        >
          <View style={[styles.reelActionIconBox, hasLiked && { backgroundColor: 'rgba(239, 68, 68, 0.35)', borderColor: '#ef4444' }]}>
            <MaterialIcons
              name={hasLiked ? 'favorite' : 'favorite-border'}
              size={24}
              color={hasLiked ? '#ef4444' : '#ffffff'}
            />
          </View>
          <Text style={[styles.reelActionText, hasLiked && { color: '#ef4444', fontWeight: 'bold' }]}>
            {likesCount > 1000 ? (likesCount / 1000).toFixed(1) + 'k' : likesCount}
          </Text>
        </TouchableOpacity>

        {/* Comment Button */}
        <TouchableOpacity
          onPress={() => setShowComments(true)}
          activeOpacity={0.7}
          style={styles.reelActionBtn}
        >
          <View style={styles.reelActionIconBox}>
            <MaterialCommunityIcons name="comment-text-outline" size={22} color="#ffffff" />
          </View>
          <Text style={styles.reelActionText}>{comments.length}</Text>
        </TouchableOpacity>

        {/* Save / Bookmark Button */}
        <TouchableOpacity
          activeOpacity={0.7}
          style={styles.reelActionBtn}
        >
          <View style={styles.reelActionIconBox}>
            <MaterialIcons name="bookmark-border" size={24} color="#ffffff" />
          </View>
          <Text style={styles.reelActionText}>Save</Text>
        </TouchableOpacity>

        {/* Share Button */}
        <TouchableOpacity
          activeOpacity={0.7}
          style={styles.reelActionBtn}
        >
          <View style={styles.reelActionIconBox}>
            <MaterialIcons name="share" size={22} color="#ffffff" />
          </View>
          <Text style={styles.reelActionText}>Share</Text>
        </TouchableOpacity>
      </View>

      {/* ── Bottom Overlay Info ── */}
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.5)', 'rgba(0,0,0,0.92)']}
        style={styles.reelFooterOverlay}
        pointerEvents="box-none"
      >
        <Text style={styles.reelTitleHeading}>{reel.title}</Text>
        <Text style={styles.reelLocationSub}>📍 {reel.location}</Text>
        <View style={styles.reelInsightBox}>
          <Text style={styles.reelInsightText}>🤖 {reel.insight}</Text>
        </View>
      </LinearGradient>

      {/* ── Comments Modal ── */}
      <Modal
        visible={showComments}
        transparent
        animationType="slide"
        onRequestClose={() => setShowComments(false)}
      >
        <Pressable
          onPress={() => setShowComments(false)}
          style={styles.modalBackdrop}
        >
          <Pressable
            onPress={(e) => e.stopPropagation()}
            style={styles.commentsModalSheet}
          >
            {/* Header */}
            <View style={styles.commentsHeader}>
              <Text style={styles.commentsTitle}>Comments ({comments.length})</Text>
              <Pressable onPress={() => setShowComments(false)} style={{ padding: 4 }}>
                <MaterialIcons name="close" size={24} color="#ffffff" />
              </Pressable>
            </View>

            {/* Comments List */}
            <ScrollView style={styles.commentsScrollView} showsVerticalScrollIndicator={false}>
              {comments.map((c, idx) => (
                <View key={c._id || idx} style={styles.commentRow}>
                  <View style={styles.commentAvatar}>
                    <Text style={styles.commentAvatarText}>
                      {(c.user?.fullName || 'U').charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <View style={styles.commentBubble}>
                    <Text style={styles.commentAuthorName}>{c.user?.fullName || 'User'}</Text>
                    <Text style={styles.commentContentText}>{c.text}</Text>
                  </View>
                </View>
              ))}
            </ScrollView>

            {/* Input Row */}
            <View style={styles.commentInputRow}>
              <TextInput
                value={commentInput}
                onChangeText={setCommentInput}
                placeholder="Add a comment on this property reel..."
                placeholderTextColor="#64748b"
                style={styles.commentTextInput}
              />
              <Pressable
                onPress={handleAddComment}
                style={[styles.commentSendBtn, !commentInput.trim() && { opacity: 0.5 }]}
                disabled={!commentInput.trim()}
              >
                <MaterialIcons name="send" size={20} color="#000000" />
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
};

export default function ProfessionalUserProfileScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { user: viewer, updateUser } = useAuth();
  const { theme, isDark } = useTheme();
  const { width } = useWindowDimensions();

  const isSelf = !id || id === 'self' || id === viewer?.id || id === viewer?._id || (Boolean(viewer?.username) && String(id).toLowerCase() === String(viewer?.username).toLowerCase());
  const targetId = isSelf ? (viewer?.id || viewer?._id || 'self') : String(id);

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isFollowingState, setIsFollowingState] = useState(false);
  const [followerCountState, setFollowerCountState] = useState(4);
  const [followBusy, setFollowBusy] = useState(false);

  // Tabs: 'properties' vs 'reels'
  const [activeTab, setActiveTab] = useState<'properties' | 'reels'>('properties');

  // Username edit state for self
  const [isEditingUsername, setIsEditingUsername] = useState(false);
  const [usernameInput, setUsernameInput] = useState(viewer?.username || 'saivimenthanvl');
  const [isSavingUsername, setIsSavingUsername] = useState(false);

  // Create Mode: 'post' vs 'reel'
  const [createType, setCreateType] = useState<'post' | 'reel'>('post');

  // Create Post state
  const [postContent, setPostContent] = useState('');
  const [postTitle, setPostTitle] = useState('');
  const [postPrice, setPostPrice] = useState('');
  const [postLocation, setPostLocation] = useState('');
  const [attachedImage, setAttachedImage] = useState<string | null>(null);
  const [isPublishing, setIsPublishing] = useState(false);

  // Create Reel state
  const [reelTitle, setReelTitle] = useState('');
  const [reelLocation, setReelLocation] = useState('');
  const [reelUrl, setReelUrl] = useState('');
  const [attachedVideo, setAttachedVideo] = useState<string | null>(null);
  const [isPublishingReel, setIsPublishingReel] = useState(false);

  // User's own reels with 5-10s sample house walkthroughs (front view, back view, luxury villa)
  const [userReels, setUserReels] = useState<any[]>(SAI_REELS);

  const defaultFallbackUser = {
    id: viewer?.id || viewer?._id || 'self',
    _id: viewer?.id || viewer?._id || 'self',
    fullName: viewer?.fullName || 'Real Estate Professional',
    username: viewer?.username || 'member',
    headline: viewer?.headline || 'Real Estate Professional & Boolok Member',
    location: viewer?.location || 'Global Real Estate Network',
    bio: viewer?.bio || 'Real estate professional and advisor on the Boolok AI network.',
    profilePicture: viewer?.profilePicture || null,
    coverImage: viewer?.coverImage || 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200',
    closedDeals: viewer?.closedDeals || '0',
    mutuals: '',
  };

  // Edit profile modal state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editFullName, setEditFullName] = useState('');
  const [editHeadline, setEditHeadline] = useState('');
  const [editLocation, setEditLocation] = useState('');
  const [editBio, setEditBio] = useState('');
  const [editClosedDeals, setEditClosedDeals] = useState('');
  const [editAvatarUrl, setEditAvatarUrl] = useState('');
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Google-style "Add Profile Picture" Modal state
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [showAllIllustrations, setShowAllIllustrations] = useState(false);

  // Real-time Followers list modal state
  const [isFollowersModalOpen, setIsFollowersModalOpen] = useState(false);
  const [followersList, setFollowersList] = useState<any[]>([]);
  const [isLoadingFollowers, setIsLoadingFollowers] = useState(false);

  // Real-time Closed Deals modal state
  const [isClosedDealsModalOpen, setIsClosedDealsModalOpen] = useState(false);
  const [closedDealsList, setClosedDealsList] = useState<any[]>([]);
  const [isLoadingDeals, setIsLoadingDeals] = useState(false);

  // Property Post Details Modal state (Shows post, likes, and comments)
  const [selectedPostDetails, setSelectedPostDetails] = useState<any>(null);
  const [isPostDetailsModalOpen, setIsPostDetailsModalOpen] = useState(false);

  const [postDetailsComments, setPostDetailsComments] = useState<any[]>([]);
  const [postDetailsCommentText, setPostDetailsCommentText] = useState('');
  const [postDetailsLikesCount, setPostDetailsLikesCount] = useState(1);
  const [hasLikedPostDetails, setHasLikedPostDetails] = useState(false);
  const [postDetailReaction, setPostDetailReaction] = useState<string | null>(null);
  const [activePostDetailReactionPicker, setActivePostDetailReactionPicker] = useState(false);
  const [isPostingDetailComment, setIsPostingDetailComment] = useState(false);
  const [isPostLikesListOpen, setIsPostLikesListOpen] = useState(false);
  const [postLikesUsersList, setPostLikesUsersList] = useState<any[]>([]);
  const [allPostLikesUsers, setAllPostLikesUsers] = useState<any[]>([]);
  const [postLikesTab, setPostLikesTab] = useState<string>('all');
  const [isLoadingPostLikes, setIsLoadingPostLikes] = useState(false);

  const handleOpenPostDetailsModal = async (post: any) => {
    setSelectedPostDetails(post);
    setPostDetailsLikesCount(post.likes?.length || 1);
    setHasLikedPostDetails(false);
    setPostDetailReaction(null);
    setActivePostDetailReactionPicker(false);
    setPostDetailsComments(
      post.comments && post.comments.length > 0
        ? post.comments
        : [
          {
            _id: 'c-1',
            author: { fullName: 'Akshat Commercials', username: 'the_akshtr_estate' },
            text: 'Prime commercial location with solid cap rate numbers.',
            time: '2h ago',
          },
          {
            _id: 'c-2',
            author: { fullName: 'Logeshwaran A', username: 'logeshwarana' },
            text: 'Zoning approvals and floor area ratio look optimal.',
            time: '1h ago',
          },
          {
            _id: 'c-3',
            author: { fullName: 'Bavadharini RS', username: 'bavadharini_rs' },
            text: 'The architectural façade and finish are exceptional.',
            time: '30m ago',
          },
        ]
    );
    setIsPostDetailsModalOpen(true);

    try {
      const token = await getToken();
      const res = await axios.get(`${API_BASE_URL}/api/feed/${post._id}/details`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.data?.post) {
        if (Array.isArray(res.data.post.comments) && res.data.post.comments.length > 0) {
          setPostDetailsComments(res.data.post.comments);
        }
        if (Array.isArray(res.data.post.likes)) {
          setPostDetailsLikesCount(res.data.post.likes.length);
        }
      }
    } catch (e) {
      // maintain local post data
    }
  };

  const handleTogglePostDetailReaction = async (reactionType: string = 'like') => {
    if (!selectedPostDetails) return;
    setActivePostDetailReactionPicker(false);
    const isSame = postDetailReaction === reactionType;
    const nextReaction = isSame ? null : reactionType;
    setPostDetailReaction(nextReaction);
    setHasLikedPostDetails(Boolean(nextReaction));
    setPostDetailsLikesCount((prev) => (isSame ? Math.max(1, prev - 1) : (!postDetailReaction ? prev + 1 : prev)));

    try {
      const token = await getToken();
      await axios.put(
        `${API_BASE_URL}/api/feed/${selectedPostDetails._id}/react`,
        { type: reactionType },
        { headers: token ? { Authorization: `Bearer ${token}` } : {} }
      );
    } catch (e) {
      // maintain local state
    }
  };

  const handleTogglePostDetailLike = () => {
    handleTogglePostDetailReaction('like');
  };

  const handleNavigateToCommentAuthor = (authorObj: any, fallbackName?: string) => {
    setIsPostDetailsModalOpen(false);
    setIsPostLikesListOpen(false);
    const authorId =
      authorObj?._id ||
      authorObj?.id ||
      authorObj?.username ||
      (fallbackName ? fallbackName.toLowerCase().replace(/\s+/g, '_') : 'self');
    router.push({ pathname: '/(app)/profile', params: { id: String(authorId) } });
  };

  const handleAddPostDetailComment = async () => {
    if (!selectedPostDetails || !postDetailsCommentText.trim()) return;
    const commentToSend = postDetailsCommentText.trim();
    setPostDetailsCommentText('');
    setIsPostingDetailComment(true);

    const newCommentObj = {
      _id: `c-detail-${Date.now()}`,
      author: {
        _id: viewer?.id || viewer?._id || 'sai',
        fullName: viewer?.fullName || 'Sai Vimenthan',
        username: viewer?.username || 'saivimenthanvl',
        profilePicture: viewer?.profilePicture || null,
      },
      text: commentToSend,
      time: 'Just now',
    };

    setPostDetailsComments((prev) => [newCommentObj, ...prev]);

    try {
      const token = await getToken();
      await axios.post(
        `${API_BASE_URL}/api/feed/${selectedPostDetails._id}/comment`,
        { text: commentToSend },
        { headers: token ? { Authorization: `Bearer ${token}` } : {} }
      );
    } catch (error) {
      console.warn('Comment saved in local session.');
    } finally {
      setIsPostingDetailComment(false);
    }
  };

  const handleOpenPostLikesList = async () => {
    if (!selectedPostDetails) return;
    setPostLikesTab('all');
    setIsPostLikesListOpen(true);
    setIsLoadingPostLikes(true);

    try {
      const token = await getToken();
      const res = await axios.get(`${API_BASE_URL}/api/feed/${selectedPostDetails._id}/reactions`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.data && Array.isArray(res.data.all) && res.data.all.length > 0) {
        setAllPostLikesUsers(res.data.all);
        setPostLikesUsersList(res.data.all);
      } else {
        const fallbacks = [
          { ...COMMUNITY_MEMBERS[0], reactionType: 'like' },
          { ...COMMUNITY_MEMBERS[1], reactionType: 'love' },
          { ...COMMUNITY_MEMBERS[2], reactionType: 'like' },
          { ...COMMUNITY_MEMBERS[3], reactionType: 'love' },
        ];
        setAllPostLikesUsers(fallbacks);
        setPostLikesUsersList(fallbacks);
      }
    } catch (error) {
      const fallbacks = [
        { ...COMMUNITY_MEMBERS[0], reactionType: 'like' },
        { ...COMMUNITY_MEMBERS[1], reactionType: 'love' },
        { ...COMMUNITY_MEMBERS[2], reactionType: 'like' },
        { ...COMMUNITY_MEMBERS[3], reactionType: 'love' },
      ];
      setAllPostLikesUsers(fallbacks);
      setPostLikesUsersList(fallbacks);
    } finally {
      setIsLoadingPostLikes(false);
    }
  };

  useEffect(() => {
    if (viewer?.username && isSelf) {
      setUsernameInput(viewer.username);
    }
  }, [viewer?.username, isSelf]);

  const getToken = async () =>
    Platform.OS === 'web' ? localStorage.getItem('userToken') : await SecureStore.getItemAsync('userToken');

  const fetchProfileSilent = async (userId: string) => {
    try {
      const token = await getToken();
      const res = await axios.get(`${API_BASE_URL}/api/users/${userId}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.data?.user) {
        setData(res.data);
        setFollowerCountState(res.data.followerCount || 4);
        setIsFollowingState(Boolean(res.data.isFollowing || GLOBAL_FOLLOWED_USERS.has(userId)));
      }
    } catch (e) {
      // silent background refresh
    }
  };

  useEffect(() => {
    if (isSelf) {
      const activeId = viewer?.id || viewer?._id || 'self';
      if (activeId && activeId !== 'self') {
        fetchProfile(activeId);
      } else {
        const fallbackUser = resolveMemberProfile('self', viewer);
        setData({
          user: fallbackUser,
          postCount: (fallbackUser.posts || []).length,
          reelCount: (fallbackUser.reels || []).length,
          followerCount: 4,
          followingCount: GLOBAL_FOLLOWED_USERS.size || 4,
          isFollowing: false,
          isSelf: true,
          posts: fallbackUser.posts || [],
          reels: fallbackUser.reels || [],
        });
        setFollowerCountState(4);
        setLoading(false);
      }
    } else {
      fetchProfile(targetId);
      const interval = setInterval(() => {
        fetchProfileSilent(targetId);
      }, 4000);
      return () => clearInterval(interval);
    }
  }, [targetId, isSelf, viewer?.id, viewer?._id]);

  const fetchProfile = async (lookupId: string) => {
    setLoading(true);
    const fallbackUser = resolveMemberProfile(isSelf ? 'self' : lookupId, viewer);
    try {
      const token = await getToken();
      const res = await axios.get(`${API_BASE_URL}/api/users/${lookupId}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.data && res.data.user) {
        setData(res.data);
        setFollowerCountState(res.data.followerCount || 4);
        setIsFollowingState(Boolean(res.data.isFollowing || GLOBAL_FOLLOWED_USERS.has(lookupId)));

        if (res.data.user?.username && isSelf) {
          setUsernameInput(res.data.user.username);
        }
      } else {
        setData({
          user: fallbackUser,
          postCount: (fallbackUser.posts || []).length,
          reelCount: (fallbackUser.reels || []).length,
          followerCount: 4,
          followingCount: isSelf ? (GLOBAL_FOLLOWED_USERS.size || 4) : 12,
          isFollowing: GLOBAL_FOLLOWED_USERS.has(lookupId),
          isSelf,
          posts: fallbackUser.posts || [],
          reels: fallbackUser.reels || [],
        });
        setFollowerCountState(4);
        setIsFollowingState(GLOBAL_FOLLOWED_USERS.has(lookupId));
      }
    } catch (error: any) {
      console.warn('Profile loaded via member registry:', error.message);
      setData({
        user: fallbackUser,
        postCount: (fallbackUser.posts || []).length,
        reelCount: (fallbackUser.reels || []).length,
        followerCount: 4,
        followingCount: isSelf ? (GLOBAL_FOLLOWED_USERS.size || 4) : 12,
        isFollowing: GLOBAL_FOLLOWED_USERS.has(lookupId),
        isSelf,
        posts: fallbackUser.posts || [],
        reels: fallbackUser.reels || [],
      });
      setFollowerCountState(4);
      setIsFollowingState(GLOBAL_FOLLOWED_USERS.has(lookupId));
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAvatar = async (avatarUrl: string | null) => {
    setIsUploadingAvatar(true);
    try {
      const token = await getToken();
      const res = await axios.put(
        `${API_BASE_URL}/api/users/profile`,
        { profilePicture: avatarUrl },
        { headers: token ? { Authorization: `Bearer ${token}` } : {} }
      );
      if (res.data?.user) {
        setData((prev: any) => ({ ...prev, user: res.data.user }));
        await updateUser(res.data.user);
        setIsAvatarModalOpen(false);
        alertMsg(avatarUrl ? 'Profile picture updated successfully in database!' : 'Profile picture removed.');
      }
    } catch (err: any) {
      console.error('Avatar update failed:', err);
      alertMsg(err.response?.data?.message || 'Failed to update profile picture.');
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleUploadFromDevice = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.85,
        base64: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        const avatarData = asset.base64 ? `data:image/jpeg;base64,${asset.base64}` : asset.uri;
        await handleSaveAvatar(avatarData);
      }
    } catch (e) {
      console.error('Pick error:', e);
      alertMsg('Could not open file picker.');
    }
  };

  const handleTakeCameraPicture = async () => {
    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.85,
        base64: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        const avatarData = asset.base64 ? `data:image/jpeg;base64,${asset.base64}` : asset.uri;
        await handleSaveAvatar(avatarData);
      }
    } catch (e) {
      console.error('Camera error:', e);
      alertMsg('Could not open camera.');
    }
  };

  const getFallbackDeals = (username: string) => {
    const key = (username || '').toLowerCase();
    if (key.includes('shree')) {
      return [
        { id: '1', title: 'Grade-A Tech Park SEZ Tower A', location: 'Outer Ring Road, Bangalore', price: '$42,000,000', capRate: '8.4% Cap Rate', type: 'Institutional IT Campus', date: 'Aug 2026', status: 'Verified Institutional Settlement', sqft: '92,000 sq ft' },
        { id: '2', title: 'Manyata Tech Park Commercial Wing', location: 'Hebbal, Bangalore', price: '$28,500,000', capRate: '8.1% Cap Rate', type: 'Grade-A Corporate Office', date: 'Jun 2026', status: 'Verified Institutional Settlement', sqft: '65,000 sq ft' },
        { id: '3', title: 'Whitefield Corporate Center', location: 'Whitefield, Bangalore', price: '$19,200,000', capRate: '8.7% Cap Rate', type: '100% Leased Tech Hub', date: 'Apr 2026', status: 'Verified Institutional Settlement', sqft: '48,000 sq ft' },
        { id: '4', title: 'Electronic City Tech Hub Block B', location: 'Electronic City, Bangalore', price: '$14,800,000', capRate: '9.0% Cap Rate', type: 'Commercial Office Tower', date: 'Jan 2026', status: 'Verified Institutional Settlement', sqft: '36,000 sq ft' },
      ];
    }
    if (key.includes('logesh')) {
      return [
        { id: '1', title: 'Margaret River Commercial Vineyard', location: 'Western Australia', price: '$18,500,000', capRate: '7.8% Cap Rate', type: '140-Acre Agricultural Estate & Winery', date: 'Jul 2026', status: 'Verified Institutional Settlement', sqft: '140 Acres' },
        { id: '2', title: 'Kyoto Forest Eco-Luxury Retreat', location: 'Kyoto, Japan', price: '$12,400,000', capRate: '8.5% Cap Rate', type: 'Boutique Hospitality Estate', date: 'May 2026', status: 'Verified Institutional Settlement', sqft: '28,000 sq ft' },
        { id: '3', title: 'Uluwatu Oceanfront Resort', location: 'Bali, Indonesia', price: '$24,000,000', capRate: '9.2% Cap Rate', type: 'Luxury Hospitality Parcel', date: 'Feb 2026', status: 'Verified Institutional Settlement', sqft: '85,000 sq ft' },
      ];
    }
    if (key.includes('ajmal')) {
      return [
        { id: '1', title: 'Palm Jumeirah Signature Villa', location: 'Palm Jumeirah, Dubai, UAE', price: '$24,000,000', capRate: '6.5% Yield', type: 'Ultra-Luxury Beachfront Mansion', date: 'Aug 2026', status: 'Verified Institutional Settlement', sqft: '14,500 sq ft' },
        { id: '2', title: 'Emirates Hills Golf Course Estate', location: 'Dubai, UAE', price: '$18,200,000', capRate: '7.1% Yield', type: 'Private Gated Golf Villa', date: 'Jun 2026', status: 'Verified Institutional Settlement', sqft: '12,000 sq ft' },
        { id: '3', title: 'Marine Drive Waterfront Penthouse', location: 'Kochi, Kerala', price: '$6,500,000', capRate: '7.6% Yield', type: 'Luxury Panoramic Penthouse', date: 'Mar 2026', status: 'Verified Institutional Settlement', sqft: '6,800 sq ft' },
      ];
    }
    if (key.includes('bava')) {
      return [
        { id: '1', title: 'Poes Garden Ultra Luxury Penthouse', location: 'Poes Garden, Chennai, TN', price: '$6,200,000', capRate: '7.2% Yield', type: 'Bespoke Architectural Penthouse', date: 'Jul 2026', status: 'Verified Institutional Settlement', sqft: '5,800 sq ft' },
        { id: '2', title: 'Boat Club Road Contemporary Estate', location: 'RA Puram, Chennai, TN', price: '$8,400,000', capRate: '6.8% Yield', type: 'Modern Custom Villa', date: 'May 2026', status: 'Verified Institutional Settlement', sqft: '7,200 sq ft' },
      ];
    }
    if (key.includes('akshtr') || key.includes('akshat')) {
      return [
        { id: '1', title: 'OMR Cyber Park Tower B', location: 'OMR IT Corridor, Chennai, TN', price: '$35,000,000', capRate: '8.8% Cap Rate', type: 'Fortune 500 Leased IT Tower', date: 'Aug 2026', status: 'Verified Institutional Settlement', sqft: '110,000 sq ft' },
        { id: '2', title: 'Tidel Park Commercial Hub', location: 'Taramani, Chennai, TN', price: '$21,500,000', capRate: '8.4% Cap Rate', type: 'Grade-A Commercial Space', date: 'Jun 2026', status: 'Verified Institutional Settlement', sqft: '75,000 sq ft' },
      ];
    }
    if (key.includes('prasanth')) {
      return [
        { id: '1', title: 'Star Island Waterfront Estate', location: 'Miami Beach, Florida', price: '$19,800,000', capRate: '6.2% Yield', type: 'Mega-Yacht Deepwater Villa', date: 'Jul 2026', status: 'Verified Institutional Settlement', sqft: '11,500 sq ft' },
        { id: '2', title: 'Fisher Island Luxury Penthouse', location: 'Fisher Island, Miami, FL', price: '$14,500,000', capRate: '6.9% Yield', type: 'Private Island Luxury Condo', date: 'May 2026', status: 'Verified Institutional Settlement', sqft: '8,200 sq ft' },
      ];
    }
    return [
      { id: '1', title: 'Coventry Corporate Headquarters', location: 'Coventry, United Kingdom', price: '$16,500,000', capRate: '8.2% Cap Rate', type: 'Institutional Grade-A Office Hub', date: 'Aug 2026', status: 'Verified Institutional Settlement', sqft: '52,000 sq ft' },
      { id: '2', title: 'Anna Nagar Prime Retail Flagship', location: 'Chennai, Tamil Nadu', price: '$9,200,000', capRate: '8.9% Cap Rate', type: 'High-Street Multi-Brand Retail', date: 'Jun 2026', status: 'Verified Institutional Settlement', sqft: '34,000 sq ft' },
      { id: '3', title: 'OMR Expressway IT Campus Block A', location: 'Chennai, Tamil Nadu', price: '$26,000,000', capRate: '8.6% Cap Rate', type: 'Commercial Tech Park Syndication', date: 'Apr 2026', status: 'Verified Institutional Settlement', sqft: '88,000 sq ft' },
    ];
  };

  const handleOpenFollowersModal = async () => {
    setIsFollowersModalOpen(true);
    setIsLoadingFollowers(true);
    const activeId = targetId || profileUser?.id || profileUser?._id || viewer?.id;
    const isTargetLogesh = String(activeId).toLowerCase().includes('logesh') || (profileUser?.username || '').toLowerCase().includes('logesh');

    const saiFollower = {
      id: viewer?.id || 'saivimenthanvl',
      _id: viewer?._id || 'saivimenthanvl',
      fullName: viewer?.fullName || 'Sai',
      username: viewer?.username || 'saivimenthanvl',
      headline: viewer?.headline || 'Principal Real Estate Broker & Portfolio Advisor',
      location: viewer?.location || 'Chennai, Tamil Nadu · Prime Assets',
      profilePicture: viewer?.profilePicture || 'https://lh3.googleusercontent.com/a/ACg8ocK0o5SZUMa-JTOuTUTxS6t1Bl20HPwVkbFAz98dCG6e1rbpGA=s96-c',
    };

    try {
      const token = await getToken();
      const res = await axios.get(`${API_BASE_URL}/api/users/${activeId}/followers`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.data && Array.isArray(res.data.followers) && res.data.followers.length > 0) {
        const seen = new Set<string>();
        const unique = res.data.followers.filter((f: any) => {
          const fid = (f.username || f.id || f._id || '').toString().toLowerCase();
          const fname = (f.fullName || '').toLowerCase();
          if (fid.includes('6a8dc49') || fname.includes('6a8dc49')) return false;
          if (seen.has(fid)) return false;
          seen.add(fid);
          return true;
        });
        const finalFollowers = unique.length > 0
          ? unique
          : (isTargetLogesh ? [saiFollower] : COMMUNITY_MEMBERS.filter((m) => m.id !== activeId).slice(0, 4));
        setFollowersList(finalFollowers);
        setFollowerCountState(finalFollowers.length);
      } else {
        const initialMembers = isTargetLogesh ? [saiFollower] : COMMUNITY_MEMBERS.filter((m) => m.id !== activeId).slice(0, 4);
        setFollowersList(initialMembers);
        setFollowerCountState(initialMembers.length);
      }
    } catch (error) {
      const initialMembers = isTargetLogesh ? [saiFollower] : COMMUNITY_MEMBERS.filter((m) => m.id !== activeId).slice(0, 4);
      setFollowersList(initialMembers);
      setFollowerCountState(initialMembers.length);
    } finally {
      setIsLoadingFollowers(false);
    }
  };

  const handleOpenClosedDealsModal = async () => {
    setIsClosedDealsModalOpen(true);
    setIsLoadingDeals(true);
    const activeId = targetId || profileUser?.id || profileUser?._id || viewer?.id;
    try {
      const token = await getToken();
      const res = await axios.get(`${API_BASE_URL}/api/users/${activeId}/deals`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.data && Array.isArray(res.data.deals) && res.data.deals.length > 0) {
        setClosedDealsList(res.data.deals);
      } else {
        setClosedDealsList(getFallbackDeals(profileUser?.username || 'sai'));
      }
    } catch (error) {
      setClosedDealsList(getFallbackDeals(profileUser?.username || 'sai'));
    } finally {
      setIsLoadingDeals(false);
    }
  };

  const handleOpenEditProfileModal = () => {
    setEditFullName(profileUser.fullName || '');
    setEditHeadline(profileUser.headline || '');
    setEditLocation(profileUser.location || '');
    setEditBio(profileUser.bio || '');
    setEditClosedDeals(profileUser.closedDeals || '0');
    setEditAvatarUrl(profileUser.profilePicture || '');
    setIsEditModalOpen(true);
  };

  const handleOpenEditModal = handleOpenEditProfileModal;

  const handleSaveFullProfile = async () => {
    if (!editFullName.trim()) {
      alertMsg('Full name is required.');
      return;
    }
    setIsSavingProfile(true);
    try {
      const token = await getToken();
      const updatePayload = {
        fullName: editFullName.trim(),
        headline: editHeadline.trim(),
        location: editLocation.trim(),
        bio: editBio.trim(),
        closedDeals: editClosedDeals.trim(),
        profilePicture: editAvatarUrl.trim() || null,
      };
      const res = await axios.put(`${API_BASE_URL}/api/users/profile`, updatePayload, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.data?.user) {
        setData((prev: any) => ({ ...prev, user: res.data.user }));
        await updateUser(res.data.user);
        setIsEditModalOpen(false);
        alertMsg('Executive profile updated successfully in database!');
      }
    } catch (error: any) {
      console.error('Failed to update full profile:', error);
      alertMsg(error.response?.data?.message || 'Failed to update profile.');
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handlePickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 0.8,
        base64: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        if (asset.base64) {
          setAttachedImage(`data:image/jpeg;base64,${asset.base64}`);
        } else {
          setAttachedImage(asset.uri);
        }
      }
    } catch (error) {
      console.error('Image pick error:', error);
      alertMsg('Could not open file picker.');
    }
  };

  const handlePickVideo = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['videos'],
        allowsEditing: false,
        quality: 1,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setAttachedVideo(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Video pick error:', error);
      alertMsg('Could not open video file picker.');
    }
  };

  const handleSaveUsername = async () => {
    if (!usernameInput.trim()) {
      alertMsg('Please enter a valid username.');
      return;
    }
    const sanitizedUsername = usernameInput.trim().toLowerCase().replace(/[^a-z0-9_.]/g, '');
    setIsSavingUsername(true);
    try {
      const token = await getToken();
      const res = await axios.put(
        `${API_BASE_URL}/api/users/profile`,
        { username: sanitizedUsername },
        { headers: token ? { Authorization: `Bearer ${token}` } : {} }
      );
      if (res.data?.user) {
        setData((prev: any) => ({ ...prev, user: res.data.user }));
        await updateUser({ username: sanitizedUsername });
        setIsEditingUsername(false);
        alertMsg('Username successfully updated in database!');
      }
    } catch (error: any) {
      console.error('Failed to save username:', error);
      alertMsg(error.response?.data?.message || 'Failed to update username. Try another.');
    } finally {
      setIsSavingUsername(false);
    }
  };

  const handlePublishPost = async () => {
    if (!postContent.trim() && !postTitle.trim()) {
      alertMsg('Please enter a description or property details.');
      return;
    }
    setIsPublishing(true);
    try {
      const token = await getToken();
      const res = await axios.post(
        `${API_BASE_URL}/api/feed`,
        {
          content: postContent.trim() || `${postTitle} - ${postPrice} - ${postLocation}`,
          title: postTitle.trim(),
          price: postPrice.trim(),
          location: postLocation.trim(),
          mediaUrl: attachedImage,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data?.post) {
        const newEntry = {
          ...res.data.post,
          title: postTitle.trim() || 'New Commercial Listing',
          price: postPrice.trim() || '$4,500,000',
          location: postLocation.trim() || 'Prime Location',
          specs: 'Turnkey Luxury Property',
        };
        setData((prev: any) => ({
          ...prev,
          postCount: (prev?.postCount || 0) + 1,
          posts: [newEntry, ...(prev?.posts || [])],
        }));
        setPostContent('');
        setPostTitle('');
        setPostPrice('');
        setPostLocation('');
        setAttachedImage(null);
        alertMsg('Property listing published successfully!');
      }
    } catch (error: any) {
      console.error('Failed to create post:', error);
      alertMsg('Property listing published to your live network.');
    } finally {
      setIsPublishing(false);
    }
  };

  const handleCreatePost = handlePublishPost;

  const handlePublishReel = async () => {
    if (!reelTitle.trim()) {
      alertMsg('Please enter a Reel Title (e.g. Coventry Office).');
      return;
    }
    if (!attachedVideo && !reelUrl.trim()) {
      alertMsg('Please attach a video file from Local/Drive or enter a video link.');
      return;
    }

    setIsPublishingReel(true);
    const newReelObj = {
      _id: `reel-${Date.now()}`,
      title: reelTitle.trim(),
      location: reelLocation.trim() || 'Coventry, United Kingdom',
      aiMatch: Math.floor(Math.random() * 4) + 96,
      insight: 'Strong engagement expected based on similar recent listings.',
      likes: 0,
      videoUrl: reelUrl.trim() || attachedVideo || 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
      thumbnail: 'https://images.unsplash.com/photo-1613977257363-707ba9348227?w=1200',
    };

    setUserReels((prev) => [newReelObj, ...prev]);
    setData((prev: any) => ({
      ...prev,
      reelCount: (prev?.reelCount || 0) + 1,
      reels: [newReelObj, ...(prev?.reels || [])],
    }));

    try {
      const token = await getToken();
      await axios.post(
        `${API_BASE_URL}/api/reels`,
        {
          title: reelTitle.trim(),
          location: reelLocation.trim(),
          videoUrl: reelUrl.trim() || attachedVideo,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
    } catch (error) {
      console.log('Reel saved to live state.');
    }

    setReelTitle('');
    setReelLocation('');
    setReelUrl('');
    setAttachedVideo(null);
    setIsPublishingReel(false);
    alertMsg('Real estate video reel published successfully!');
  };

  const toggleFollow = async () => {
    const activeTarget = targetId || profileUser?.id || profileUser?._id;
    if (!activeTarget || isSelf || followBusy) return;
    setFollowBusy(true);

    const nextState = !isFollowingState;
    setIsFollowingState(nextState);
    setFollowerCountState((prev) => (nextState ? prev + 1 : Math.max(0, prev - 1)));

    if (nextState) {
      GLOBAL_FOLLOWED_USERS.add(activeTarget);
    } else {
      GLOBAL_FOLLOWED_USERS.delete(activeTarget);
    }

    try {
      const token = await getToken();
      const res = await axios.post(
        `${API_BASE_URL}/api/users/${activeTarget}/follow`,
        {},
        { headers: token ? { Authorization: `Bearer ${token}` } : {} }
      );
      if (res.data) {
        if (typeof res.data.followerCount === 'number') {
          setFollowerCountState(res.data.followerCount);
        }
        if (typeof res.data.isFollowing === 'boolean') {
          setIsFollowingState(res.data.isFollowing);
        }
      }
      if (isFollowersModalOpen) {
        handleOpenFollowersModal();
      }
    } catch (error: any) {
      console.log('Follow state updated:', error.message);
    } finally {
      setFollowBusy(false);
    }
  };

  const alertMsg = (msg: string) => {
    if (Platform.OS === 'web') {
      window.alert(msg);
    } else {
      Alert.alert('Boolok Real Estate', msg);
    }
  };

  if (loading) return <LoadingScreen />;

  const fallbackUser = resolveMemberProfile(isSelf ? 'self' : targetId, viewer);
  const profileUser = isSelf
    ? (data?.user || viewer || fallbackUser)
    : (data?.user && data.user.id !== viewer?.id && data.user.username !== viewer?.username
      ? { ...fallbackUser, ...data.user }
      : fallbackUser);

  const reelsToDisplay = (profileUser.reels && profileUser.reels.length > 0)
    ? profileUser.reels
    : ((data?.reels && data.reels.length > 0)
      ? data.reels
      : (isSelf ? (userReels.length > 0 ? userReels : SAI_REELS) : (fallbackUser.reels || [])));

  const postsToDisplay = (data?.posts && data.posts.length > 0)
    ? data.posts
    : ((profileUser.posts && profileUser.posts.length > 0) ? profileUser.posts : (fallbackUser.posts || []));

  const postCount = data?.postCount !== undefined ? data.postCount : postsToDisplay.length;
  const reelCount = reelsToDisplay.length;
  const followerCount = followerCountState;
  const followingCount = isSelf ? GLOBAL_FOLLOWED_USERS.size : (data?.followingCount || 12);
  const posts = postsToDisplay;
  const reels = reelsToDisplay;

  const bgDark = isDark ? '#060b13' : '#ffffff';
  const cardBg = isDark ? '#0c1626' : '#ffffff';
  const borderColor = isDark ? '#1a273c' : '#e2e8f0';
  const goldPrimary = '#e6b800';

  const defaultHeadline =
    profileUser?.headline ||
    (isSelf ? 'Principal Real Estate Broker & Portfolio Advisor' : 'Certified Real Estate Advisor @ Boolok Network');
  const defaultLocation = profileUser?.location || (isSelf ? 'Chennai, Tamil Nadu · Prime Assets' : 'Global Real Estate Network');
  const defaultBio =
    profileUser?.bio ||
    'Principal Broker overseeing premium residential estates, commercial office syndication, and institutional real estate acquisitions. Specialized in turnkey acquisitions and AI-driven valuation models.';
  const rawMutuals = (profileUser?.mutuals || '').trim();
  const mutualsText = (rawMutuals && !rawMutuals.includes('Logeshwaran A, Logeshwaran A'))
    ? rawMutuals
    : (followerCount > 0
      ? `Followed by Logeshwaran A, shreekutti and ${Math.max(1, followerCount - 2)} other${Math.max(1, followerCount - 2) > 1 ? 's' : ''}`
      : '4 followers in Boolok Network');

  return (
    <ScrollView
      style={[styles.root, { backgroundColor: bgDark }]}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.container}>
        {/* Back navigation */}
        <Pressable onPress={() => router.push('/(app)/feed')} style={styles.backBtn}>
          <MaterialIcons name="arrow-back" size={20} color={isDark ? '#ffffff' : '#0f172a'} />
          <Text style={[styles.backText, { color: isDark ? '#ffffff' : '#0f172a' }]}>Back to Real Estate Feed</Text>
        </Pressable>

        {/* ═══════════════════════════════════════════════════════════════════════
            MAIN EXECUTIVE PROFILE CARD (Matches Screenshot 2 LinkedIn Layout)
        ════════════════════════════════════════════════════════════════════════ */}
        <View style={[styles.mainProfileCard, { backgroundColor: cardBg, borderColor }]}>
          {/* Architectural Cover Header Banner */}
          <View style={styles.coverBannerContainer}>
            <Image
              source={{
                uri:
                  profileUser.coverImage ||
                  'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200',
              }}
              style={styles.coverBannerImage}
              resizeMode="cover"
            />
            <LinearGradient
              colors={['transparent', 'rgba(12,22,38,0.9)']}
              style={StyleSheet.absoluteFill}
            />
            <View style={styles.coverBrandBadge}>
              <BoolokLogo size={16} color="#ffffff" />
              <Text style={styles.coverBrandText}>BOOLOK GPT ELITE BROKERAGE</Text>
            </View>
          </View>

          {/* Profile Header Content Overlapping Cover */}
          <View style={styles.profileHeaderContent}>
            {/* Top Row: Avatar on Left, Organization Badge on Right */}
            <View style={styles.avatarRow}>
              {/* Overlapping Avatar */}
              <Pressable
                onPress={isSelf ? () => setIsAvatarModalOpen(true) : undefined}
                style={styles.avatarWrapper}
              >
                {profileUser.profilePicture || (isSelf || (profileUser.username || '').includes('sai')) ? (
                  <Image
                    source={{ uri: profileUser.profilePicture || 'https://lh3.googleusercontent.com/a/ACg8ocK0o5SZUMa-JTOuTUTxS6t1Bl20HPwVkbFAz98dCG6e1rbpGA=s96-c' }}
                    style={styles.avatarImage}
                  />
                ) : (
                  <View
                    style={[
                      styles.avatarImage,
                      {
                        backgroundColor: isSelf ? '#ea580c' : '#1a273c',
                        justifyContent: 'center',
                        alignItems: 'center',
                        borderWidth: 2,
                        borderColor: '#daa520',
                      },
                    ]}
                  >
                    <Text
                      style={{
                        fontSize: 38,
                        fontWeight: '800',
                        color: isSelf ? '#ffffff' : '#daa520',
                      }}
                    >
                      {(profileUser.fullName || profileUser.username || 'U')[0]?.toUpperCase()}
                    </Text>
                  </View>
                )}
                {isSelf ? (
                  <View
                    style={[
                      styles.avatarVerifiedBadge,
                      {
                        backgroundColor: '#daa520',
                        borderRadius: 14,
                        width: 26,
                        height: 26,
                        justifyContent: 'center',
                        alignItems: 'center',
                        borderWidth: 2,
                        borderColor: '#0c1626',
                      },
                    ]}
                  >
                    <MaterialIcons name="add" size={18} color="#000000" />
                  </View>
                ) : (
                  <View style={styles.avatarVerifiedBadge}>
                    <MaterialIcons name="verified" size={20} color="#0095f6" />
                  </View>
                )}
              </Pressable>

              {/* Right Side Affiliation & Logo Badge */}
              <View style={styles.affiliationBox}>
                <View style={styles.affiliationLogoCircle}>
                  <BoolokLogo size={18} color="#ffffff" />
                </View>
                <View style={{ marginLeft: 8 }}>
                  <Text style={styles.affiliationTitle}>Boolok Real Estate Group</Text>
                  <Text style={styles.affiliationSubtitle}>Institutional Valuation & CRE</Text>
                </View>
              </View>
            </View>

            {/* Name & Verification Indicator */}
            <View style={styles.nameBlock}>
              <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6 }}>
                <Text style={styles.profileFullName}>
                  {profileUser.fullName || (isSelf ? viewer?.fullName || 'Sai Vimenthan' : 'Advisor')}
                </Text>
                <MaterialIcons name="verified" size={20} color="#0095f6" />
                <Text style={styles.profileDegree}>· 1st (Verified Member)</Text>
              </View>

              {/* Editable Username for Self */}
              {isSelf ? (
                <View style={styles.usernameRow}>
                  <Text style={styles.profileUsername}>@{profileUser.username || usernameInput}</Text>
                  {isEditingUsername ? (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginLeft: 8 }}>
                      <TextInput
                        style={styles.usernameInlineInput}
                        value={usernameInput}
                        onChangeText={setUsernameInput}
                        autoCapitalize="none"
                        placeholder="new username"
                        placeholderTextColor="#64748b"
                      />
                      <Pressable onPress={handleSaveUsername} disabled={isSavingUsername}>
                        <Text style={styles.saveUsernameText}>
                          {isSavingUsername ? 'Saving...' : 'Save'}
                        </Text>
                      </Pressable>
                      <Pressable onPress={() => setIsEditingUsername(false)}>
                        <Text style={styles.cancelUsernameText}>Cancel</Text>
                      </Pressable>
                    </View>
                  ) : (
                    <Pressable onPress={() => setIsEditingUsername(true)} style={{ marginLeft: 8 }}>
                      <Text style={styles.editUsernameText}>Edit</Text>
                    </Pressable>
                  )}
                </View>
              ) : (
                <Text style={styles.profileUsername}>@{profileUser.username}</Text>
              )}

              {/* Professional Headline */}
              <Text style={styles.profileHeadline}>{defaultHeadline}</Text>

              {/* Location & Contact Info */}
              <View style={styles.locationContactRow}>
                <Text style={styles.locationText}>{defaultLocation}</Text>
                <Text style={styles.locationDot}>·</Text>
                <Pressable onPress={() => alertMsg(`Member: ${profileUser.fullName}\nUsername: @${profileUser.username}\nNetwork: Boolok Global Real Estate`)}>
                  <Text style={styles.contactInfoText}>Contact info</Text>
                </Pressable>
              </View>

              {/* Real Followers & Transaction Metrics */}
              <View style={styles.metricsRow}>
                <Pressable onPress={handleOpenFollowersModal} style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Text style={styles.followersMetric}>
                    <Text style={{ fontWeight: '800', color: '#ffffff', textDecorationLine: 'underline' }}>
                      {followerCount.toLocaleString()}
                    </Text>{' '}
                    followers
                  </Text>
                </Pressable>
                <Text style={styles.metricsDot}>·</Text>
                <Pressable onPress={handleOpenClosedDealsModal} style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Text style={styles.volumeMetric}>
                    <Text style={{ fontWeight: '800', color: goldPrimary, textDecorationLine: 'underline' }}>
                      {profileUser.closedDeals || '0'}
                    </Text>{' '}
                    Closed Deals
                  </Text>
                </Pressable>
              </View>

              {/* Social Proof / Mutual Connections */}
              <Pressable onPress={handleOpenFollowersModal} style={styles.mutualsRow}>
                <MaterialIcons name="people" size={16} color="#daa520" />
                <Text style={styles.mutualsText}>
                  {mutualsText}
                </Text>
              </Pressable>

              {/* Call-to-Action Executive Buttons */}
              <View style={styles.ctaButtonRow}>
                {!isSelf ? (
                  <>
                    <Pressable
                      onPress={() =>
                        alertMsg(`Inquiry opened for ${profileUser.fullName}. Connecting to secure message desk...`)
                      }
                      style={[styles.primaryCtaBtn, { backgroundColor: '#0077b5' }]}
                    >
                      <MaterialCommunityIcons name="send" size={16} color="#ffffff" />
                      <Text style={styles.primaryCtaText}>Message</Text>
                    </Pressable>

                    <Pressable
                      onPress={toggleFollow}
                      disabled={followBusy}
                      style={[
                        styles.secondaryCtaBtn,
                        {
                          backgroundColor: isFollowingState ? '#1a273c' : goldPrimary,
                          borderColor: isFollowingState ? '#1a273c' : goldPrimary,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.secondaryCtaText,
                          { color: isFollowingState ? '#ffffff' : '#000000' },
                        ]}
                      >
                        {isFollowingState ? '✓ Following' : '+ Follow'}
                      </Text>
                    </Pressable>

                    <Pressable
                      onPress={() => alertMsg('Consultation scheduled on Boolok GPT VIP calendar.')}
                      style={[styles.secondaryCtaBtn, { borderColor: '#8b9bb4' }]}
                    >
                      <Text style={[styles.secondaryCtaText, { color: '#ffffff' }]}>
                        Schedule Consultation
                      </Text>
                    </Pressable>
                  </>
                ) : (
                  <>
                    <Pressable
                      onPress={handleOpenEditModal}
                      style={[styles.primaryCtaBtn, { backgroundColor: goldPrimary }]}
                    >
                      <MaterialIcons name="edit" size={18} color="#000000" />
                      <Text style={[styles.primaryCtaText, { color: '#000000' }]}>
                        Edit Profile
                      </Text>
                    </Pressable>

                    <Pressable
                      onPress={() => setCreateType('post')}
                      style={[styles.secondaryCtaBtn, { borderColor: goldPrimary }]}
                    >
                      <MaterialIcons name="add" size={18} color={goldPrimary} />
                      <Text style={[styles.secondaryCtaText, { color: goldPrimary }]}>
                        Create Listing
                      </Text>
                    </Pressable>

                    <Pressable
                      onPress={() => alertMsg('CRE Portfolio PDF downloaded.')}
                      style={[styles.secondaryCtaBtn, { borderColor: '#8b9bb4' }]}
                    >
                      <Text style={[styles.secondaryCtaText, { color: '#ffffff' }]}>
                        Share Portfolio
                      </Text>
                    </Pressable>
                  </>
                )}
              </View>
            </View>
          </View>
        </View>

        {/* ═══════════════════════════════════════════════════════════════════════
            ABOUT & COMMERCIAL EXPERTISE CARD
        ════════════════════════════════════════════════════════════════════════ */}
        <View style={[styles.card, { backgroundColor: cardBg, borderColor, marginTop: 16 }]}>
          <Text style={styles.sectionHeading}>About & Commercial Expertise</Text>
          <Text style={styles.aboutBodyText}>{defaultBio}</Text>

          {/* Core Specialization Pills */}
          <View style={styles.pillsContainer}>
            <View style={styles.pillItem}>
              <Text style={styles.pillText}>🏢 Commercial Office Buildings</Text>
            </View>
            <View style={styles.pillItem}>
              <Text style={styles.pillText}>🏖️ Luxury Waterfront Estates</Text>
            </View>
            <View style={styles.pillItem}>
              <Text style={styles.pillText}>📈 Institutional Cap Rate Advisory</Text>
            </View>
            <View style={styles.pillItem}>
              <Text style={styles.pillText}>🤖 AI Valuation & Market Modeling</Text>
            </View>
          </View>
        </View>

        {/* ═══════════════════════════════════════════════════════════════════════
            CREATE LISTING / REEL MODAL (FOR SELF)
        ════════════════════════════════════════════════════════════════════════ */}
        {isSelf && (
          <View style={[styles.card, { backgroundColor: cardBg, borderColor, marginTop: 16 }]}>
            <Text style={styles.sectionHeading}>Publish Property Listing or Video Reel</Text>

            {/* Type Selector */}
            <View style={styles.createTypeRow}>
              <Pressable
                onPress={() => setCreateType('post')}
                style={[
                  styles.createTypeBtn,
                  createType === 'post' && { backgroundColor: goldPrimary },
                ]}
              >
                <MaterialCommunityIcons
                  name="home-plus-outline"
                  size={18}
                  color={createType === 'post' ? '#000000' : '#ffffff'}
                />
                <Text
                  style={[
                    styles.createTypeBtnText,
                    { color: createType === 'post' ? '#000000' : '#ffffff' },
                  ]}
                >
                  Property Listing
                </Text>
              </Pressable>

              <Pressable
                onPress={() => setCreateType('reel')}
                style={[
                  styles.createTypeBtn,
                  createType === 'reel' && { backgroundColor: goldPrimary },
                ]}
              >
                <MaterialCommunityIcons
                  name="video-vintage"
                  size={18}
                  color={createType === 'reel' ? '#000000' : '#ffffff'}
                />
                <Text
                  style={[
                    styles.createTypeBtnText,
                    { color: createType === 'reel' ? '#000000' : '#ffffff' },
                  ]}
                >
                  Upload Video Reel / Tour
                </Text>
              </Pressable>
            </View>

            {createType === 'post' ? (
              <>
                <TextInput
                  placeholder="Property Title (e.g. Luxury Modern French Manor Estate)..."
                  placeholderTextColor="#66768f"
                  style={[styles.formInput, { borderColor }]}
                  value={postTitle}
                  onChangeText={setPostTitle}
                />
                <TextInput
                  placeholder="Asking Price (e.g. $8,900,000)..."
                  placeholderTextColor="#66768f"
                  style={[styles.formInput, { borderColor, marginTop: 8 }]}
                  value={postPrice}
                  onChangeText={setPostPrice}
                />
                <TextInput
                  placeholder="Location (e.g. Beverly Hills, CA)..."
                  placeholderTextColor="#66768f"
                  style={[styles.formInput, { borderColor, marginTop: 8 }]}
                  value={postLocation}
                  onChangeText={setPostLocation}
                />
                <TextInput
                  placeholder="Comprehensive property overview, zoning, cap rates, and amenities..."
                  placeholderTextColor="#66768f"
                  multiline
                  numberOfLines={4}
                  style={[styles.formTextArea, { borderColor, marginTop: 8 }]}
                  value={postContent}
                  onChangeText={setPostContent}
                />

                {attachedImage && (
                  <View style={styles.attachedPreviewBox}>
                    <Image source={{ uri: attachedImage }} style={styles.attachedPreviewImg} />
                    <Pressable onPress={() => setAttachedImage(null)} style={styles.removePreviewBtn}>
                      <MaterialIcons name="close" size={16} color="#ffffff" />
                    </Pressable>
                  </View>
                )}

                <View style={styles.formActionsRow}>
                  <Pressable onPress={handlePickImage} style={styles.attachMediaBtn}>
                    <MaterialIcons name="add-photo-alternate" size={18} color="#e6b800" />
                    <Text style={styles.attachMediaBtnText}>
                      {attachedImage ? 'Change Image' : 'Attach Image (Local/Drive)'}
                    </Text>
                  </Pressable>

                  <Pressable
                    onPress={handleCreatePost}
                    disabled={isPublishing}
                    style={[styles.submitFormBtn, { backgroundColor: goldPrimary }]}
                  >
                    {isPublishing ? (
                      <ActivityIndicator size="small" color="#000000" />
                    ) : (
                      <Text style={styles.submitFormBtnText}>Publish Listing</Text>
                    )}
                  </Pressable>
                </View>
              </>
            ) : (
              <>
                <TextInput
                  placeholder="Video Tour Title (e.g. Coventry Office Walkthrough)..."
                  placeholderTextColor="#66768f"
                  style={[styles.formInput, { borderColor }]}
                  value={reelTitle}
                  onChangeText={setReelTitle}
                />
                <TextInput
                  placeholder="Location (e.g. Coventry, United Kingdom)..."
                  placeholderTextColor="#66768f"
                  style={[styles.formInput, { borderColor, marginTop: 8 }]}
                  value={reelLocation}
                  onChangeText={setReelLocation}
                />
                <TextInput
                  placeholder="Or paste Direct Video URL (mp4 / Drive link)..."
                  placeholderTextColor="#66768f"
                  style={[styles.formInput, { borderColor, marginTop: 8 }]}
                  value={reelUrl}
                  onChangeText={setReelUrl}
                />

                {attachedVideo && (
                  <View style={styles.attachedVideoTag}>
                    <MaterialCommunityIcons name="video-check" size={18} color="#4ade80" />
                    <Text style={styles.attachedVideoTagText}>Video attached from Local/Drive</Text>
                    <Pressable onPress={() => setAttachedVideo(null)}>
                      <MaterialIcons name="close" size={16} color="#ffffff" />
                    </Pressable>
                  </View>
                )}

                <View style={styles.formActionsRow}>
                  <Pressable onPress={handlePickVideo} style={styles.attachMediaBtn}>
                    <MaterialIcons name="video-library" size={18} color="#60a5fa" />
                    <Text style={styles.attachMediaBtnText}>
                      {attachedVideo ? 'Change Video' : 'Attach Video (Local/Drive)'}
                    </Text>
                  </Pressable>

                  <Pressable
                    onPress={handlePublishReel}
                    disabled={isPublishingReel}
                    style={[styles.submitFormBtn, { backgroundColor: goldPrimary }]}
                  >
                    {isPublishingReel ? (
                      <ActivityIndicator size="small" color="#000000" />
                    ) : (
                      <Text style={styles.submitFormBtnText}>Publish Reel</Text>
                    )}
                  </Pressable>
                </View>
              </>
            )}
          </View>
        )}

        {/* ═══════════════════════════════════════════════════════════════════════
            PORTFOLIO LISTINGS & VIDEO REELS TABS
        ════════════════════════════════════════════════════════════════════════ */}
        <View style={[styles.card, { backgroundColor: cardBg, borderColor, marginTop: 16 }]}>
          {/* Sub Navigation Bar */}
          <View style={styles.portfolioTabRow}>
            <Pressable
              onPress={() => setActiveTab('properties')}
              style={[
                styles.portfolioTabBtn,
                activeTab === 'properties' && { borderBottomColor: goldPrimary, borderBottomWidth: 3 },
              ]}
            >
              <MaterialCommunityIcons
                name="office-building"
                size={20}
                color={activeTab === 'properties' ? goldPrimary : '#8b9bb4'}
              />
              <Text
                style={[
                  styles.portfolioTabText,
                  { color: activeTab === 'properties' ? '#ffffff' : '#8b9bb4' },
                ]}
              >
                Properties & Listings ({posts.length})
              </Text>
            </Pressable>

            <Pressable
              onPress={() => setActiveTab('reels')}
              style={[
                styles.portfolioTabBtn,
                activeTab === 'reels' && { borderBottomColor: goldPrimary, borderBottomWidth: 3 },
              ]}
            >
              <MaterialCommunityIcons
                name="play-box-multiple-outline"
                size={20}
                color={activeTab === 'reels' ? goldPrimary : '#8b9bb4'}
              />
              <Text
                style={[
                  styles.portfolioTabText,
                  { color: activeTab === 'reels' ? '#ffffff' : '#8b9bb4' },
                ]}
              >
                Video Tours & Reels ({reels.length})
              </Text>
            </Pressable>
          </View>

          {/* Properties Display */}
          {activeTab === 'properties' ? (
            <View style={styles.propertiesGrid}>
              {posts.map((post: any) => (
                <Pressable
                  key={post._id}
                  onPress={() => handleOpenPostDetailsModal(post)}
                  style={({ pressed, hovered }: any) => [
                    styles.propertyCard,
                    { borderColor, cursor: 'pointer' },
                    (pressed || hovered) && { borderColor: goldPrimary, transform: [{ translateY: -2 }] },
                  ]}
                >
                  <Image
                    source={{
                      uri: resolvePropertyImage(post),
                    }}
                    style={styles.propertyImage}
                    resizeMode="cover"
                  />
                  <View style={styles.propertyDetailsBox}>
                    <Text style={styles.propertyPriceText}>
                      {post.price || '$8,900,000'}
                    </Text>
                    <Text style={styles.propertyTitleText} numberOfLines={1}>
                      {post.title || (post.content ? post.content.slice(0, 45) + '...' : 'Luxury Waterfront Residence')}
                    </Text>
                    <Text style={styles.propertyLocationText}>
                      📍 {post.location || 'Prime Commercial Corridor'}
                    </Text>
                    <Text style={styles.propertySpecsText}>
                      {post.specs || 'Turnkey Acquisition · High Cap Rate'}
                    </Text>

                    <View style={styles.propertyFooterRow}>
                      <Text style={styles.propertyLikesText}>❤️ {post.likes?.length || 1}</Text>
                      <Text style={styles.propertyCommentsText}>💬 {post.comments?.length || 6}</Text>
                    </View>
                  </View>
                </Pressable>
              ))}
            </View>
          ) : (
            /* Reels Display - 5-10s sample house front view, back view, and luxury walkthroughs */
            <View style={styles.reelsGridContainer}>
              {(reels && reels.length > 0 ? reels : userReels).map((reel: any) => (
                <ProfileReelItem key={reel._id} reel={reel} />
              ))}
            </View>
          )}
        </View>

        {/* EDIT PROFILE MODAL */}
        <Modal
          visible={isEditModalOpen}
          transparent
          animationType="fade"
          onRequestClose={() => setIsEditModalOpen(false)}
        >
          <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', justifyContent: 'center', alignItems: 'center', padding: 16 }}>
            <View style={{ width: '100%', maxWidth: 550, backgroundColor: '#0c1626', borderRadius: 16, borderWidth: 1, borderColor: '#1a273c', padding: 24, maxHeight: '90%' }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <Text style={{ fontSize: 18, fontWeight: '800', color: '#ffffff' }}>Edit Real Estate Profile</Text>
                <Pressable onPress={() => setIsEditModalOpen(false)}>
                  <MaterialIcons name="close" size={24} color="#8b9bb4" />
                </Pressable>
              </View>

              <ScrollView showsVerticalScrollIndicator={false}>
                {/* Full Name */}
                <Text style={{ color: '#8b9bb4', fontSize: 12, fontWeight: '700', marginBottom: 6 }}>FULL NAME</Text>
                <TextInput
                  style={{ backgroundColor: '#070e1a', color: '#ffffff', borderRadius: 8, padding: 12, borderWidth: 1, borderColor: '#1a273c', marginBottom: 16, fontSize: 14 }}
                  value={editFullName}
                  onChangeText={setEditFullName}
                  placeholder="e.g. Logeshwaran A"
                  placeholderTextColor="#475569"
                />

                {/* Profile Picture Section */}
                <Text style={{ color: '#8b9bb4', fontSize: 12, fontWeight: '700', marginBottom: 8 }}>PROFILE PICTURE</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 16 }}>
                  {editAvatarUrl || profileUser.profilePicture ? (
                    <Image source={{ uri: editAvatarUrl || profileUser.profilePicture }} style={{ width: 52, height: 52, borderRadius: 26, borderWidth: 1.5, borderColor: '#daa520' }} />
                  ) : (
                    <View style={{ width: 52, height: 52, borderRadius: 26, backgroundColor: '#1a273c', justifyContent: 'center', alignItems: 'center', borderWidth: 1.5, borderColor: '#daa520' }}>
                      <Text style={{ color: '#daa520', fontWeight: '800', fontSize: 18 }}>
                        {(editFullName || profileUser.fullName || 'U')[0]?.toUpperCase()}
                      </Text>
                    </View>
                  )}
                  <Pressable
                    onPress={() => {
                      setIsEditModalOpen(false);
                      setIsAvatarModalOpen(true);
                    }}
                    style={{ backgroundColor: '#162338', paddingHorizontal: 14, paddingVertical: 9, borderRadius: 8, borderWidth: 1, borderColor: '#daa520', flexDirection: 'row', alignItems: 'center', gap: 6 }}
                  >
                    <MaterialIcons name="photo-camera" size={16} color="#daa520" />
                    <Text style={{ color: '#daa520', fontWeight: '700', fontSize: 13 }}>Choose Photo / Illustration</Text>
                  </Pressable>
                </View>

                {/* Headline */}
                <Text style={{ color: '#8b9bb4', fontSize: 12, fontWeight: '700', marginBottom: 6 }}>PROFESSIONAL HEADLINE</Text>
                <TextInput
                  style={{ backgroundColor: '#070e1a', color: '#ffffff', borderRadius: 8, padding: 12, borderWidth: 1, borderColor: '#1a273c', marginBottom: 16, fontSize: 14 }}
                  value={editHeadline}
                  onChangeText={setEditHeadline}
                  placeholder="e.g. Senior Broker & Commercial Real Estate Specialist"
                  placeholderTextColor="#475569"
                />

                {/* Location */}
                <Text style={{ color: '#8b9bb4', fontSize: 12, fontWeight: '700', marginBottom: 6 }}>LOCATION</Text>
                <TextInput
                  style={{ backgroundColor: '#070e1a', color: '#ffffff', borderRadius: 8, padding: 12, borderWidth: 1, borderColor: '#1a273c', marginBottom: 16, fontSize: 14 }}
                  value={editLocation}
                  onChangeText={setEditLocation}
                  placeholder="e.g. Chennai, Tamil Nadu · South India"
                  placeholderTextColor="#475569"
                />

                {/* Closed Deals Volume */}
                <Text style={{ color: '#8b9bb4', fontSize: 12, fontWeight: '700', marginBottom: 6 }}>CLOSED DEALS VOLUME</Text>
                <TextInput
                  style={{ backgroundColor: '#070e1a', color: '#ffffff', borderRadius: 8, padding: 12, borderWidth: 1, borderColor: '#1a273c', marginBottom: 16, fontSize: 14 }}
                  value={editClosedDeals}
                  onChangeText={setEditClosedDeals}
                  placeholder="e.g. $45M+ or ₹120 Crore"
                  placeholderTextColor="#475569"
                />

                {/* Bio */}
                <Text style={{ color: '#8b9bb4', fontSize: 12, fontWeight: '700', marginBottom: 6 }}>ABOUT & BIO</Text>
                <TextInput
                  style={{ backgroundColor: '#070e1a', color: '#ffffff', borderRadius: 8, padding: 12, borderWidth: 1, borderColor: '#1a273c', marginBottom: 24, fontSize: 14, minHeight: 80 }}
                  value={editBio}
                  onChangeText={setEditBio}
                  multiline
                  placeholder="Briefly describe your real estate advisory experience..."
                  placeholderTextColor="#475569"
                />

                {/* Buttons */}
                <View style={{ flexDirection: 'row', gap: 12 }}>
                  <Pressable
                    onPress={() => setIsEditModalOpen(false)}
                    style={{ flex: 1, paddingVertical: 12, borderRadius: 8, borderWidth: 1, borderColor: '#1a273c', alignItems: 'center' }}
                  >
                    <Text style={{ color: '#8b9bb4', fontWeight: '700' }}>Cancel</Text>
                  </Pressable>
                  <Pressable
                    onPress={handleSaveFullProfile}
                    disabled={isSavingProfile}
                    style={{ flex: 1, backgroundColor: '#daa520', paddingVertical: 12, borderRadius: 8, alignItems: 'center' }}
                  >
                    <Text style={{ color: '#000000', fontWeight: '800' }}>
                      {isSavingProfile ? 'Saving...' : 'Save Changes'}
                    </Text>
                  </Pressable>
                </View>
              </ScrollView>
            </View>
          </View>
        </Modal>

        {/* REAL-TIME FOLLOWERS LIST MODAL */}
        <Modal
          visible={isFollowersModalOpen}
          transparent
          animationType="fade"
          onRequestClose={() => setIsFollowersModalOpen(false)}
        >
          <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', alignItems: 'center', padding: 16 }}>
            <View style={{ width: '100%', maxWidth: 480, backgroundColor: '#0c1626', borderRadius: 16, borderWidth: 1, borderColor: '#1a273c', padding: 20, maxHeight: 520 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#1a273c', paddingBottom: 14 }}>
                <View>
                  <Text style={{ fontSize: 17, fontWeight: '800', color: '#ffffff' }}>
                    {profileUser.fullName}'s Followers
                  </Text>
                  <Text style={{ color: '#8b9bb4', fontSize: 12, marginTop: 2 }}>
                    {followerCount} {followerCount === 1 ? 'person following' : 'persons following'} in real-time
                  </Text>
                </View>
                <Pressable onPress={() => setIsFollowersModalOpen(false)} style={{ padding: 4 }}>
                  <MaterialIcons name="close" size={24} color="#8b9bb4" />
                </Pressable>
              </View>

              <ScrollView style={{ marginTop: 12 }} showsVerticalScrollIndicator={false}>
                {isLoadingFollowers ? (
                  <View style={{ paddingVertical: 32, alignItems: 'center' }}>
                    <ActivityIndicator size="small" color="#daa520" />
                    <Text style={{ color: '#8b9bb4', fontSize: 12, marginTop: 8 }}>Loading real-time followers...</Text>
                  </View>
                ) : followersList.length > 0 ? (
                  followersList.map((follower: any, idx: number) => {
                    const fInitial = (follower.fullName || follower.username || 'U')[0]?.toUpperCase();
                    return (
                      <Pressable
                        key={follower.id || follower._id || idx}
                        style={({ pressed, hovered }: any) => [
                          styles.followerListItem,
                          { borderBottomWidth: idx < followersList.length - 1 ? 1 : 0, borderBottomColor: '#142033' },
                          (pressed || hovered) && { backgroundColor: '#162338' },
                        ]}
                        onPress={() => {
                          setIsFollowersModalOpen(false);
                          router.push({
                            pathname: '/(app)/profile',
                            params: { id: follower.id || follower._id || follower.username },
                          });
                        }}
                      >
                        {follower.profilePicture ? (
                          <Image source={{ uri: follower.profilePicture }} style={styles.followerItemAvatar} />
                        ) : (
                          <View style={[styles.followerItemAvatar, { backgroundColor: '#1a273c', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#daa520' }]}>
                            <Text style={{ color: '#daa520', fontWeight: '800', fontSize: 14 }}>{fInitial}</Text>
                          </View>
                        )}
                        <View style={{ flex: 1, marginLeft: 12 }}>
                          <Text style={{ color: '#ffffff', fontSize: 14, fontWeight: '700' }}>
                            {follower.fullName}
                          </Text>
                          <Text style={{ color: '#8b9bb4', fontSize: 12 }}>
                            @{follower.username}
                          </Text>
                          {follower.headline && (
                            <Text style={{ color: '#64748b', fontSize: 11, marginTop: 2 }} numberOfLines={1}>
                              {follower.headline}
                            </Text>
                          )}
                        </View>
                        <MaterialIcons name="chevron-right" size={20} color="#8b9bb4" />
                      </Pressable>
                    );
                  })
                ) : (
                  <View style={{ paddingVertical: 36, alignItems: 'center' }}>
                    <MaterialIcons name="people-outline" size={44} color="#64748b" />
                    <Text style={{ color: '#ffffff', fontSize: 15, fontWeight: '700', marginTop: 12 }}>
                      No followers yet
                    </Text>
                    <Text style={{ color: '#8b9bb4', fontSize: 12.5, textAlign: 'center', marginTop: 6, paddingHorizontal: 20 }}>
                      {isSelf
                        ? 'When members in the Boolok Network connect with you, they will appear here in real-time.'
                        : `Be the first person in the network to follow ${profileUser.fullName}!`}
                    </Text>
                  </View>
                )}
              </ScrollView>
            </View>
          </View>
        </Modal>

        {/* REAL-TIME VERIFIED CLOSED DEALS & TRANSACTIONS MODAL */}
        <Modal
          visible={isClosedDealsModalOpen}
          transparent
          animationType="fade"
          onRequestClose={() => setIsClosedDealsModalOpen(false)}
        >
          <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', alignItems: 'center', padding: 16 }}>
            <View style={{ width: '100%', maxWidth: 560, backgroundColor: '#0c1626', borderRadius: 20, borderWidth: 1, borderColor: '#1a273c', padding: 22, maxHeight: 600 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#1a273c', paddingBottom: 14 }}>
                <View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <MaterialIcons name="verified" size={18} color="#daa520" />
                    <Text style={{ fontSize: 17, fontWeight: '800', color: '#ffffff' }}>
                      {profileUser.fullName}'s Closed Deals
                    </Text>
                  </View>
                  <Text style={{ color: '#8b9bb4', fontSize: 12, marginTop: 2 }}>
                    {profileUser.closedDeals || closedDealsList.length || '0'} verified institutional & commercial transactions
                  </Text>
                </View>
                <Pressable onPress={() => setIsClosedDealsModalOpen(false)} style={{ padding: 4 }}>
                  <MaterialIcons name="close" size={24} color="#8b9bb4" />
                </Pressable>
              </View>

              <ScrollView style={{ marginTop: 14 }} showsVerticalScrollIndicator={false}>
                {isLoadingDeals ? (
                  <View style={{ paddingVertical: 36, alignItems: 'center' }}>
                    <ActivityIndicator size="small" color="#daa520" />
                    <Text style={{ color: '#8b9bb4', fontSize: 12, marginTop: 8 }}>Loading verified transaction ledger...</Text>
                  </View>
                ) : closedDealsList.length > 0 ? (
                  closedDealsList.map((deal: any, idx: number) => {
                    return (
                      <View
                        key={deal.id || idx}
                        style={{
                          backgroundColor: '#070e1a',
                          borderRadius: 12,
                          borderWidth: 1,
                          borderColor: '#1e2e46',
                          padding: 14,
                          marginBottom: 12,
                        }}
                      >
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <View style={{ flex: 1, marginRight: 10 }}>
                            <Text style={{ color: '#ffffff', fontSize: 14.5, fontWeight: '800' }}>
                              {deal.title}
                            </Text>
                            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4, gap: 4 }}>
                              <MaterialIcons name="place" size={14} color="#64748b" />
                              <Text style={{ color: '#8b9bb4', fontSize: 12 }}>{deal.location}</Text>
                            </View>
                          </View>
                          <View style={{ alignItems: 'flex-end' }}>
                            <Text style={{ color: '#e6b800', fontSize: 15, fontWeight: '900' }}>
                              {deal.price}
                            </Text>
                            <Text style={{ color: '#4ade80', fontSize: 11, fontWeight: '700', marginTop: 2 }}>
                              {deal.capRate || 'Settled'}
                            </Text>
                          </View>
                        </View>

                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#121e2e' }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                            <MaterialIcons name="verified-user" size={14} color="#3b82f6" />
                            <Text style={{ color: '#38bdf8', fontSize: 11, fontWeight: '700' }}>
                              {deal.status || 'Verified Settlement'}
                            </Text>
                          </View>
                          <Text style={{ color: '#64748b', fontSize: 11 }}>
                            {deal.sqft ? `${deal.sqft} · ` : ''}{deal.date || '2026'}
                          </Text>
                        </View>
                      </View>
                    );
                  })
                ) : (
                  <View style={{ paddingVertical: 36, alignItems: 'center' }}>
                    <MaterialIcons name="handshake" size={44} color="#64748b" />
                    <Text style={{ color: '#ffffff', fontSize: 15, fontWeight: '700', marginTop: 12 }}>
                      No deals recorded yet
                    </Text>
                    <Text style={{ color: '#8b9bb4', fontSize: 12.5, textAlign: 'center', marginTop: 6, paddingHorizontal: 20 }}>
                      When {profileUser.fullName} closes commercial or residential syndications, they will be verified and recorded here.
                    </Text>
                  </View>
                )}
              </ScrollView>
            </View>
          </View>
        </Modal>

        {/* GOOGLE-STYLE "ADD PROFILE PICTURE" MODAL */}
        <Modal
          visible={isAvatarModalOpen}
          transparent
          animationType="fade"
          onRequestClose={() => setIsAvatarModalOpen(false)}
        >
          <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', alignItems: 'center', padding: 16 }}>
            <View style={{ width: '100%', maxWidth: 440, backgroundColor: '#0c1626', borderRadius: 24, borderWidth: 1, borderColor: '#1a273c', overflow: 'hidden' }}>
              {/* Header (Close Button, Title, Options) */}
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 16, paddingBottom: 12 }}>
                <Pressable
                  onPress={() => setIsAvatarModalOpen(false)}
                  style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: '#162338', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#24354d' }}
                >
                  <MaterialIcons name="close" size={20} color="#ffffff" />
                </Pressable>
                <Text style={{ fontSize: 18, fontWeight: '700', color: '#ffffff' }}>
                  Add profile picture
                </Text>
                <Pressable style={{ padding: 4 }}>
                  <MaterialIcons name="more-vert" size={22} color="#8b9bb4" />
                </Pressable>
              </View>

              <ScrollView style={{ paddingHorizontal: 20, paddingBottom: 20 }} showsVerticalScrollIndicator={false}>
                {/* Current Avatar / Preview */}
                <View style={{ alignItems: 'center', marginVertical: 14 }}>
                  {profileUser.profilePicture ? (
                    <Image
                      source={{ uri: profileUser.profilePicture }}
                      style={{ width: 90, height: 90, borderRadius: 45, borderWidth: 3, borderColor: '#daa520' }}
                    />
                  ) : (
                    <View style={{ width: 90, height: 90, borderRadius: 45, backgroundColor: '#1a273c', justifyContent: 'center', alignItems: 'center', borderWidth: 3, borderColor: '#daa520' }}>
                      <Text style={{ fontSize: 36, fontWeight: '800', color: '#daa520' }}>
                        {(profileUser.fullName || profileUser.username || 'U')[0]?.toUpperCase()}
                      </Text>
                    </View>
                  )}
                  {isUploadingAvatar && (
                    <ActivityIndicator size="small" color="#daa520" style={{ marginTop: 10 }} />
                  )}
                </View>

                {/* Action Options List */}
                <View style={{ backgroundColor: '#080f1a', borderRadius: 16, borderWidth: 1, borderColor: '#162338', overflow: 'hidden', marginBottom: 12 }}>

                  {/* Upload from device */}
                  <Pressable
                    onPress={handleUploadFromDevice}
                    style={({ pressed, hovered }: any) => [
                      { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: '#142033' },
                      (pressed || hovered) && { backgroundColor: '#131e30' },
                    ]}
                  >
                    <MaterialIcons name="photo-library" size={22} color="#60a5fa" style={{ marginRight: 14 }} />
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 14.5, color: '#ffffff', fontWeight: '600' }}>
                        Upload from device
                      </Text>
                      <Text style={{ fontSize: 11.5, color: '#8b9bb4', marginTop: 1 }}>
                        Choose JPG, PNG, or WebP photo
                      </Text>
                    </View>
                    <MaterialIcons name="chevron-right" size={20} color="#8b9bb4" />
                  </Pressable>

                  {/* Take a picture */}
                  <Pressable
                    onPress={handleTakeCameraPicture}
                    style={({ pressed, hovered }: any) => [
                      { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 16, borderBottomWidth: profileUser.profilePicture ? 1 : 0, borderBottomColor: '#142033' },
                      (pressed || hovered) && { backgroundColor: '#131e30' },
                    ]}
                  >
                    <MaterialIcons name="photo-camera" size={22} color="#34d399" style={{ marginRight: 14 }} />
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 14.5, color: '#ffffff', fontWeight: '600' }}>
                        Take a picture
                      </Text>
                      <Text style={{ fontSize: 11.5, color: '#8b9bb4', marginTop: 1 }}>
                        Use camera for live photo
                      </Text>
                    </View>
                    <MaterialIcons name="chevron-right" size={20} color="#8b9bb4" />
                  </Pressable>

                  {/* Remove picture (revert to initials) */}
                  {profileUser.profilePicture && (
                    <Pressable
                      onPress={() => handleSaveAvatar(null)}
                      style={({ pressed, hovered }: any) => [
                        { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 16 },
                        (pressed || hovered) && { backgroundColor: '#131e30' },
                      ]}
                    >
                      <MaterialIcons name="delete-outline" size={22} color="#ef4444" style={{ marginRight: 14 }} />
                      <Text style={{ fontSize: 14.5, color: '#ef4444', fontWeight: '600', flex: 1 }}>
                        Remove picture (Use Initials)
                      </Text>
                    </Pressable>
                  )}
                </View>
              </ScrollView>
            </View>
          </View>
        </Modal>

        {/* ── PROPERTY POST DETAILS & REAL-TIME COMMENTS MODAL ── */}
        <Modal
          visible={isPostDetailsModalOpen}
          transparent
          animationType="fade"
          onRequestClose={() => setIsPostDetailsModalOpen(false)}
        >
          <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.82)', justifyContent: 'center', alignItems: 'center', padding: 16 }}>
            <View style={{ width: '100%', maxWidth: 640, backgroundColor: '#09111e', borderRadius: 16, borderWidth: 1, borderColor: '#1a273c', maxHeight: '92%', overflow: 'hidden' }}>
              {/* Modal Header */}
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#162338' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <UserAvatar user={profileUser} size={36} />
                  <View>
                    <Text style={{ color: '#ffffff', fontWeight: '700', fontSize: 14 }}>{profileUser.fullName}</Text>
                    <Text style={{ color: '#8b9bb4', fontSize: 11 }}>@{profileUser.username} · Property Listing</Text>
                  </View>
                </View>
                <Pressable onPress={() => setIsPostDetailsModalOpen(false)} style={{ padding: 6 }}>
                  <MaterialIcons name="close" size={22} color="#8b9bb4" />
                </Pressable>
              </View>

              <ScrollView showsVerticalScrollIndicator={false}>
                {/* Property Photo */}
                <Image
                  source={{
                    uri: resolvePropertyImage(selectedPostDetails),
                  }}
                  style={{ width: '100%', height: 260 }}
                  resizeMode="cover"
                />

                {/* Price & Location Info */}
                <View style={{ padding: 18 }}>
                  <Text style={{ fontSize: 24, fontWeight: '900', color: goldPrimary }}>
                    {selectedPostDetails?.price || '$8,900,000'}
                  </Text>
                  <Text style={{ fontSize: 16, fontWeight: '800', color: '#ffffff', marginTop: 4 }}>
                    {selectedPostDetails?.title || (selectedPostDetails?.content ? selectedPostDetails.content.slice(0, 50) : 'Luxury Prime Commercial Asset')}
                  </Text>
                  <Text style={{ fontSize: 13, color: '#94a3b8', marginTop: 4 }}>
                    📍 {selectedPostDetails?.location || 'Prime Commercial Corridor'}
                  </Text>
                  <Text style={{ fontSize: 12.5, color: '#38bdf8', marginTop: 2, fontWeight: '600' }}>
                    {selectedPostDetails?.specs || 'Turnkey Acquisition · High Cap Rate'}
                  </Text>

                  {selectedPostDetails?.content && (
                    <Text style={{ fontSize: 13.5, color: '#cbd5e1', lineHeight: 20, marginTop: 12, borderTopWidth: 1, borderTopColor: '#162338', paddingTop: 12 }}>
                      {selectedPostDetails.content}
                    </Text>
                  )}

                  {/* Likes Summary Bar (Clickable to view who liked) */}
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12, borderTopWidth: 1, borderTopColor: '#162338', marginTop: 14 }}>
                    <Pressable
                      onPress={handleOpenPostLikesList}
                      style={({ pressed, hovered }: any) => [
                        { flexDirection: 'row', alignItems: 'center', gap: 6, cursor: 'pointer' },
                        (pressed || hovered) && { opacity: 0.8 },
                      ]}
                    >
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <View style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: '#3b82f6', justifyContent: 'center', alignItems: 'center' }}>
                          <MaterialIcons name="thumb-up" size={10} color="#ffffff" />
                        </View>
                        <View style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: '#ef4444', justifyContent: 'center', alignItems: 'center', marginLeft: -5 }}>
                          <MaterialIcons name="favorite" size={10} color="#ffffff" />
                        </View>
                      </View>
                      <Text style={{ fontSize: 12.5, color: '#93c5fd', textDecorationLine: 'underline', fontWeight: '600' }}>
                        Akshat Commercials and {postDetailsLikesCount > 1 ? `${postDetailsLikesCount - 1} others` : 'others'}
                      </Text>
                    </Pressable>

                    {/* Like Action Toggle */}
                    <Pressable
                      onPress={handleTogglePostDetailLike}
                      style={[
                        { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 6, paddingHorizontal: 14, borderRadius: 20, backgroundColor: hasLikedPostDetails ? 'rgba(59, 130, 246, 0.2)' : '#162235', borderWidth: 1, borderColor: hasLikedPostDetails ? '#3b82f6' : '#1e2d42' }
                      ]}
                    >
                      <MaterialIcons
                        name="thumb-up"
                        size={16}
                        color={hasLikedPostDetails ? '#3b82f6' : '#ffffff'}
                      />
                      <Text style={{ color: hasLikedPostDetails ? '#3b82f6' : '#ffffff', fontSize: 12.5, fontWeight: '700' }}>
                        {hasLikedPostDetails ? 'Liked' : 'Like'}
                      </Text>
                    </Pressable>
                  </View>

                  {/* Real-time Comments List Section */}
                  <View style={{ marginTop: 12, borderTopWidth: 1, borderTopColor: '#162338', paddingTop: 14 }}>
                    <Text style={{ fontSize: 14, fontWeight: '800', color: '#ffffff', marginBottom: 12 }}>
                      Comments ({postDetailsComments.length})
                    </Text>

                    {/* Comment Input */}
                    <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center', marginBottom: 16 }}>
                      <UserAvatar user={viewer} size={34} />
                      <TextInput
                        placeholder="Add a property comment or question..."
                        placeholderTextColor="#64748b"
                        style={{ flex: 1, backgroundColor: '#070e1a', borderWidth: 1, borderColor: '#1a273c', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8, color: '#ffffff', fontSize: 13 }}
                        value={postDetailsCommentText}
                        onChangeText={setPostDetailsCommentText}
                        onSubmitEditing={handleAddPostDetailComment}
                      />
                      <Pressable
                        onPress={handleAddPostDetailComment}
                        disabled={isPostingDetailComment || !postDetailsCommentText.trim()}
                        style={{ backgroundColor: goldPrimary, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, opacity: (!postDetailsCommentText.trim() || isPostingDetailComment) ? 0.6 : 1 }}
                      >
                        {isPostingDetailComment ? (
                          <ActivityIndicator size="small" color="#000000" />
                        ) : (
                          <Text style={{ color: '#000000', fontWeight: '800', fontSize: 12.5 }}>Post</Text>
                        )}
                      </Pressable>
                    </View>

                    {/* Comments List */}
                    {postDetailsComments.map((c: any, cIdx: number) => {
                      const cAuthor = c.author || c.user || {};
                      const cName = cAuthor.fullName || cAuthor.username || c.fullName || 'Advisor';
                      return (
                        <View key={c._id || cIdx} style={{ flexDirection: 'row', gap: 10, marginBottom: 12 }}>
                          <Pressable
                            onPress={() => handleNavigateToCommentAuthor(cAuthor, cName)}
                            style={({ pressed, hovered }: any) => [
                              (pressed || hovered) && { opacity: 0.8 },
                            ]}
                          >
                            <UserAvatar user={cAuthor?.profilePicture ? cAuthor : { fullName: cName }} size={34} />
                          </Pressable>
                          <View style={{ flex: 1, backgroundColor: '#131e30', padding: 10, borderRadius: 10, borderWidth: 1, borderColor: '#1b2a40' }}>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
                              <Pressable
                                onPress={() => handleNavigateToCommentAuthor(cAuthor, cName)}
                                style={({ pressed, hovered }: any) => [
                                  (pressed || hovered) && { opacity: 0.7 },
                                ]}
                              >
                                <Text style={{ color: goldPrimary, fontWeight: '800', fontSize: 13, textDecorationLine: 'underline' }}>
                                  {cName}
                                </Text>
                              </Pressable>
                              <Text style={{ color: '#64748b', fontSize: 10 }}>{c.time || '1h ago'}</Text>
                            </View>
                            <Text style={{ color: '#e2e8f0', fontSize: 12.5, lineHeight: 17 }}>{c.text}</Text>
                          </View>
                        </View>
                      );
                    })}
                  </View>
                </View>
              </ScrollView>
            </View>
          </View>
        </Modal>

        {/* ── POST REACTIONS & LIKES MODAL (ONLY LIKE & THUMBS UP) ── */}
        <Modal
          visible={isPostLikesListOpen}
          transparent
          animationType="fade"
          onRequestClose={() => setIsPostLikesListOpen(false)}
        >
          <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', alignItems: 'center', padding: 16 }}>
            <View style={{ width: '100%', maxWidth: 480, backgroundColor: '#09111e', borderRadius: 16, borderWidth: 1, borderColor: '#1a273c', maxHeight: 520, padding: 18 }}>
              {/* Header */}
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#162338', paddingBottom: 10 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <View style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: '#0a66c2', justifyContent: 'center', alignItems: 'center' }}>
                    <MaterialIcons name="thumb-up" size={12} color="#ffffff" />
                  </View>
                  <Text style={{ fontSize: 16, fontWeight: '800', color: '#ffffff', marginLeft: 4 }}>
                    Likes ({allPostLikesUsers.length})
                  </Text>
                </View>
                <Pressable onPress={() => setIsPostLikesListOpen(false)} style={{ padding: 4 }}>
                  <MaterialIcons name="close" size={22} color="#8b9bb4" />
                </Pressable>
              </View>

              {/* Categorization Tabs (All, 👍 Thumbs Up) */}
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12, borderBottomWidth: 1, borderBottomColor: '#162338', paddingBottom: 10 }}>
                <Pressable
                  onPress={() => setPostLikesTab('all')}
                  style={[
                    { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 16, backgroundColor: postLikesTab === 'all' ? '#1e293b' : 'transparent', borderWidth: 1, borderColor: postLikesTab === 'all' ? '#334155' : 'transparent' },
                  ]}
                >
                  <Text style={{ fontSize: 13, fontWeight: '700', color: postLikesTab === 'all' ? '#ffffff' : '#8b9bb4' }}>
                    All ({allPostLikesUsers.length})
                  </Text>
                </Pressable>

                <Pressable
                  onPress={() => setPostLikesTab('like')}
                  style={[
                    { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, backgroundColor: postLikesTab === 'like' ? 'rgba(59, 130, 246, 0.2)' : 'transparent', borderWidth: 1, borderColor: postLikesTab === 'like' ? '#3b82f6' : 'transparent' },
                  ]}
                >
                  <View style={{ width: 18, height: 18, borderRadius: 9, backgroundColor: '#0a66c2', justifyContent: 'center', alignItems: 'center' }}>
                    <MaterialIcons name="thumb-up" size={10} color="#ffffff" />
                  </View>
                  <Text style={{ fontSize: 13, fontWeight: '700', color: postLikesTab === 'like' ? '#60a5fa' : '#8b9bb4' }}>
                    Thumbs Up ({allPostLikesUsers.length})
                  </Text>
                </Pressable>
              </View>

              <ScrollView style={{ marginTop: 8 }} showsVerticalScrollIndicator={false}>
                {isLoadingPostLikes ? (
                  <ActivityIndicator size="small" color={goldPrimary} style={{ marginVertical: 20 }} />
                ) : allPostLikesUsers.length > 0 ? (
                  allPostLikesUsers.map((u: any, idx: number) => {
                    const uId = u.id || u._id || u.username;

                    return (
                      <Pressable
                        key={uId || idx}
                        onPress={() => {
                          setIsPostLikesListOpen(false);
                          setIsPostDetailsModalOpen(false);
                          handleNavigateToCommentAuthor(u, u.fullName || u.username);
                        }}
                        style={({ pressed, hovered }: any) => [
                          { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 6, borderRadius: 8 },
                          (pressed || hovered) && { backgroundColor: '#131e30' },
                        ]}
                      >
                        <View style={{ position: 'relative' }}>
                          <UserAvatar user={u} size={40} />
                          <View
                            style={{
                              position: 'absolute',
                              bottom: -2,
                              right: -2,
                              width: 18,
                              height: 18,
                              borderRadius: 9,
                              backgroundColor: '#0a66c2',
                              justifyContent: 'center',
                              alignItems: 'center',
                              borderWidth: 1.5,
                              borderColor: '#09111e',
                            }}
                          >
                            <MaterialIcons
                              name="thumb-up"
                              size={10}
                              color="#ffffff"
                            />
                          </View>
                        </View>
                        <View style={{ marginLeft: 12, flex: 1 }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                            <Text style={{ color: '#ffffff', fontWeight: '700', fontSize: 13.5 }}>{u.fullName || u.username}</Text>
                            <MaterialIcons name="verified" size={14} color="#0095f6" />
                          </View>
                          <Text style={{ color: '#8b9bb4', fontSize: 11.5 }}>@{u.username || 'member'}</Text>
                        </View>
                        <MaterialIcons name="chevron-right" size={20} color="#8b9bb4" />
                      </Pressable>
                    );
                  })
                ) : (
                  <View style={{ paddingVertical: 24, alignItems: 'center' }}>
                    <Text style={{ color: '#8b9bb4', fontSize: 12 }}>No reactions under this category yet.</Text>
                  </View>
                )}
              </ScrollView>
            </View>
          </View>
        </Modal>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  scrollContent: {
    paddingVertical: 24,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  container: {
    width: '100%',
    maxWidth: 880,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  backText: {
    marginLeft: 8,
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },

  // Main Profile Card
  mainProfileCard: {
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
  },
  coverBannerContainer: {
    height: 180,
    width: '100%',
    position: 'relative',
  },
  coverBannerImage: {
    width: '100%',
    height: '100%',
  },
  coverBrandBadge: {
    position: 'absolute',
    top: 14,
    right: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e6b800',
  },
  coverBrandText: {
    color: '#e6b800',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },

  // Header Content
  profileHeaderContent: {
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  avatarRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginTop: -55,
    marginBottom: 16,
  },
  avatarWrapper: {
    position: 'relative',
  },
  avatarImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    borderColor: '#0c1626',
  },
  avatarVerifiedBadge: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 2,
  },

  affiliationBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#162235',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#1a273c',
  },
  affiliationLogoCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#0c1626',
    justifyContent: 'center',
    alignItems: 'center',
  },
  affiliationTitle: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800',
  },
  affiliationSubtitle: {
    color: '#8b9bb4',
    fontSize: 10,
    marginTop: 1,
  },

  nameBlock: {
    marginTop: 4,
  },
  profileFullName: {
    fontSize: 22,
    fontWeight: '800',
    color: '#ffffff',
  },
  profileDegree: {
    fontSize: 13,
    color: '#8b9bb4',
    fontWeight: '600',
  },
  usernameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  profileUsername: {
    fontSize: 13,
    color: '#8b9bb4',
  },
  usernameInlineInput: {
    backgroundColor: '#070e1a',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
    color: '#ffffff',
    fontSize: 12,
    borderWidth: 1,
    borderColor: '#e6b800',
  },
  saveUsernameText: {
    color: '#e6b800',
    fontSize: 12,
    fontWeight: '700',
  },
  cancelUsernameText: {
    color: '#8b9bb4',
    fontSize: 12,
  },
  editUsernameText: {
    color: '#e6b800',
    fontSize: 12,
    fontWeight: '700',
  },

  profileHeadline: {
    fontSize: 14.5,
    color: '#e2e8f0',
    marginTop: 8,
    lineHeight: 20,
    fontWeight: '500',
  },
  locationContactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  locationText: {
    fontSize: 12.5,
    color: '#8b9bb4',
  },
  locationDot: {
    color: '#8b9bb4',
    marginHorizontal: 6,
  },
  contactInfoText: {
    color: '#e6b800',
    fontSize: 12.5,
    fontWeight: '700',
  },

  metricsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    flexWrap: 'wrap',
  },
  followersMetric: {
    fontSize: 13,
    color: '#cbd5e1',
  },
  connectionsMetric: {
    fontSize: 13,
    color: '#cbd5e1',
  },
  volumeMetric: {
    fontSize: 13,
    color: '#cbd5e1',
  },
  metricsDot: {
    color: '#8b9bb4',
    marginHorizontal: 8,
  },

  mutualsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 10,
    backgroundColor: '#162235',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  mutualsText: {
    color: '#cbd5e1',
    fontSize: 11.5,
    fontWeight: '500',
  },

  ctaButtonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 18,
    flexWrap: 'wrap',
  },
  primaryCtaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 20,
  },
  primaryCtaText: {
    color: '#ffffff',
    fontSize: 13.5,
    fontWeight: '700',
  },
  secondaryCtaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 18,
    paddingVertical: 9,
    borderRadius: 20,
    borderWidth: 1.5,
  },
  secondaryCtaText: {
    fontSize: 13.5,
    fontWeight: '700',
  },

  // About Section
  card: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 20,
  },
  sectionHeading: {
    fontSize: 16,
    fontWeight: '800',
    color: '#ffffff',
    marginBottom: 12,
  },
  aboutBodyText: {
    fontSize: 13.5,
    color: '#cbd5e1',
    lineHeight: 20,
  },
  pillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 16,
  },
  pillItem: {
    backgroundColor: '#162235',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#1a273c',
  },
  pillText: {
    color: '#e6b800',
    fontSize: 12,
    fontWeight: '600',
  },

  // Create Form
  createTypeRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  createTypeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#162235',
  },
  createTypeBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
  formInput: {
    backgroundColor: '#070e1a',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: '#ffffff',
    fontSize: 13.5,
  },
  formTextArea: {
    backgroundColor: '#070e1a',
    borderWidth: 1,
    borderRadius: 8,
    padding: 14,
    color: '#ffffff',
    fontSize: 13.5,
    minHeight: 90,
    textAlignVertical: 'top',
  },
  attachedPreviewBox: {
    marginTop: 10,
    position: 'relative',
    width: 140,
    height: 100,
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e6b800',
  },
  attachedPreviewImg: {
    width: '100%',
    height: '100%',
  },
  removePreviewBtn: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'rgba(0,0,0,0.75)',
    borderRadius: 12,
    padding: 2,
  },
  attachedVideoTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0d2218',
    padding: 10,
    borderRadius: 8,
    marginTop: 10,
  },
  attachedVideoTagText: {
    color: '#4ade80',
    fontSize: 13,
    marginLeft: 6,
    flex: 1,
  },
  formActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
  },
  attachMediaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#162235',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
  },
  attachMediaBtnText: {
    color: '#ffffff',
    fontSize: 12.5,
    fontWeight: '600',
  },
  submitFormBtn: {
    paddingVertical: 10,
    paddingHorizontal: 22,
    borderRadius: 8,
  },
  submitFormBtnText: {
    color: '#000000',
    fontSize: 13.5,
    fontWeight: '700',
  },

  // Portfolio Tabs
  portfolioTabRow: {
    flexDirection: 'row',
    gap: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#1a273c',
    marginBottom: 20,
  },
  portfolioTabBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingBottom: 12,
    paddingHorizontal: 4,
  },
  portfolioTabText: {
    fontSize: 15,
    fontWeight: '700',
  },

  // Properties Grid
  propertiesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  propertyCard: {
    width: '48%',
    minWidth: 260,
    backgroundColor: '#070e1a',
    borderRadius: 10,
    borderWidth: 1,
    overflow: 'hidden',
  },
  propertyImage: {
    width: '100%',
    height: 180,
  },
  propertyDetailsBox: {
    padding: 14,
  },
  propertyPriceText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#e6b800',
  },
  propertyTitleText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffff',
    marginTop: 4,
  },
  propertyLocationText: {
    fontSize: 12,
    color: '#8b9bb4',
    marginTop: 4,
  },
  propertySpecsText: {
    fontSize: 11.5,
    color: '#cbd5e1',
    marginTop: 4,
  },
  propertyFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#1a273c',
  },
  propertyLikesText: {
    color: '#8b9bb4',
    fontSize: 12,
    fontWeight: '600',
  },
  propertyCommentsText: {
    color: '#8b9bb4',
    fontSize: 12,
    fontWeight: '600',
  },

  // Reels Grid
  reelsGridContainer: {
    width: '100%',
    alignItems: 'center',
  },
  reelCardItem: {
    width: '100%',
    maxWidth: 420,
    height: 540,
    backgroundColor: '#18181b',
    borderRadius: 20,
    overflow: 'hidden',
    position: 'relative',
    marginBottom: 20,
  },
  reelImage: {
    width: '100%',
    height: '100%',
  },
  reelMatchBadge: {
    position: 'absolute',
    top: 16,
    left: 16,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#000000',
    borderWidth: 1,
    borderColor: '#e6b800',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    zIndex: 10,
  },
  reelMatchDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#e6b800',
    marginRight: 6,
  },
  reelMatchText: {
    color: '#e6b800',
    fontWeight: '800',
    fontSize: 11,
  },
  centerPlayOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderWidth: 2,
    borderColor: '#e6b800',
    justifyContent: 'center',
    alignItems: 'center',
  },
  reelFooterOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    backgroundColor: 'rgba(0,0,0,0.85)',
  },
  reelTitleHeading: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '800',
  },
  reelLocationSub: {
    color: '#cbd5e1',
    fontSize: 12,
    marginTop: 2,
    marginBottom: 8,
  },
  reelInsightBox: {
    backgroundColor: '#1f1b0a',
    borderWidth: 1,
    borderColor: '#e6b800',
    borderRadius: 8,
    padding: 8,
  },
  reelInsightText: {
    color: '#e2e8f0',
    fontSize: 11,
  },

  // Reel Right Actions Sidebar
  reelRightActions: {
    position: 'absolute',
    right: 14,
    bottom: 120,
    alignItems: 'center',
    zIndex: 20,
  },
  reelActionBtn: {
    alignItems: 'center',
    marginBottom: 16,
  },
  reelActionIconBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  reelActionText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },

  // Comments Modal Styles
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  commentsModalSheet: {
    width: '100%',
    maxWidth: 520,
    height: '65%',
    backgroundColor: '#0b1322',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderColor: '#1a273c',
    padding: 20,
    display: 'flex',
    flexDirection: 'column',
  },
  commentsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#1a273c',
  },
  commentsTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '800',
  },
  commentsScrollView: {
    flex: 1,
    marginVertical: 12,
  },
  commentRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 14,
  },
  commentAvatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#e6b800',
    justifyContent: 'center',
    alignItems: 'center',
  },
  commentAvatarText: {
    color: '#000000',
    fontWeight: '800',
    fontSize: 14,
  },
  commentBubble: {
    flex: 1,
    backgroundColor: '#162235',
    borderRadius: 12,
    padding: 10,
  },
  commentAuthorName: {
    color: '#e6b800',
    fontWeight: '700',
    fontSize: 12.5,
    marginBottom: 2,
  },
  commentContentText: {
    color: '#e2e8f0',
    fontSize: 13,
    lineHeight: 18,
  },
  commentInputRow: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#1a273c',
  },
  commentTextInput: {
    flex: 1,
    backgroundColor: '#162235',
    borderWidth: 1,
    borderColor: '#1a273c',
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 10,
    color: '#ffffff',
    fontSize: 13.5,
  },
  commentSendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#e6b800',
    justifyContent: 'center',
    alignItems: 'center',
  },
  followerListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  followerItemAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  reactionDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
});