import React, { useEffect, useState } from "react";
import { View } from "react-native";
import PagerView from "react-native-pager-view";

// Auto-playing, looping pager for the banner carousels. Replaces the
// unmaintained react-native-snap-carousel / react-native-swiper usages with
// react-native-pager-view (New-Architecture supported) plus a light autoplay
// interval — the same autoplay/loop contract the old components provided.
interface Props {
  data: any[];
  renderItem: (item: any, index: number) => React.ReactNode;
  style?: any;
  autoplayInterval?: number;
}

export const AutoPager = ({
  data,
  renderItem,
  style,
  autoplayInterval = 4000,
}: Props) => {
  const [pagerRef, setPagerRef] = useState<any>(null);
  const [page, setPage] = useState(0);

  useEffect(() => {
    if (!data || data.length <= 1) return;
    const id = setInterval(() => {
      setPage((prev) => {
        const next = prev + 1 >= data.length ? 0 : prev + 1;
        try {
          pagerRef?.setPage(next);
        } catch {
          // pager not mounted yet
        }
        return next;
      });
    }, autoplayInterval);
    return () => clearInterval(id);
  }, [data, data?.length, autoplayInterval, pagerRef]);

  if (!data || data.length === 0) {
    return null;
  }

  return (
    <PagerView
      ref={setPagerRef}
      style={[{ flex: 1 }, style]}
      initialPage={0}
      onPageSelected={(e: any) => setPage(e?.nativeEvent?.position ?? 0)}
    >
      {data.map((item, index) => (
        <View key={index.toString()} collapsable={false} style={{ flex: 1 }}>
          {renderItem(item, index)}
        </View>
      ))}
    </PagerView>
  );
};

export default AutoPager;
