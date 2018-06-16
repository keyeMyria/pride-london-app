// @flow
import R from "ramda";
import type { DataAction } from "../actions/data";
import type { Event } from "../data/event";
import type { FeaturedEvents } from "../data/featured-events";
import type { HeaderBanner } from "../data/header-banner";
import type { Images } from "../data/image";
import type { Performances } from "../data/performance";
import type { Sponsor } from "../data/sponsor";
import { decodeEvent, expandRecurringEvents } from "../data/event";
import decodeFeaturedEvents from "../data/featured-events";
import decodeHeaderBanner from "../data/header-banner";
import { decodeImageDetails } from "../data/image";
import decodePerformance from "../data/performance";
import decodeSponsor from "../data/sponsor";
import locale from "../data/locale";
import type { Decoder } from "../lib/decode";
import { filterMap as decodeFilterMap, map as decodeMap } from "../lib/decode";
import { withDefault as resultWithDefault } from "../lib/result";

export type State = {
  events: Event[],
  featuredEvents: FeaturedEvents[],
  headerBanners: HeaderBanner[],
  images: Images,
  performances: Performances,
  sponsors: Sponsor[],
  loading: boolean,
  refreshing: boolean
};

const defaultState = {
  events: [],
  featuredEvents: [],
  headerBanners: [],
  images: {},
  performances: {},
  sponsors: [],
  loading: true,
  refreshing: false
};

type ObjectWithId<A> = {
  id: string
} & A;

const reduceToMapHelp = <A>(
  acc: { [id: string]: ObjectWithId<A> },
  item: ObjectWithId<A>
): { [id: string]: ObjectWithId<A> } => {
  acc[item.id] = item; // intentional mutation as this happens in a reduce
  return acc;
};

// moving locale here so we can deal with it in a single place
// this can be moved inside the reducer function if we later want
// to make this dynamic
const decodeEvents: Decoder<Array<Event>> = decodeMap(
  events => R.unnest(events.map(expandRecurringEvents)),
  decodeFilterMap(decodeEvent(locale))
);

const decodeFeaturedEventsCollection: Decoder<
  Array<FeaturedEvents>
> = decodeFilterMap(decodeFeaturedEvents(locale));

const decodeHeaderBanners: Decoder<Array<HeaderBanner>> = decodeFilterMap(
  decodeHeaderBanner(locale)
);

const decodeImages: Decoder<Images> = decodeMap(
  images => images.reduce(reduceToMapHelp, {}),
  decodeFilterMap(decodeImageDetails(locale))
);

const decodePerformances: Decoder<Performances> = decodeMap(
  performances => performances.reduce(reduceToMapHelp, {}),
  decodeFilterMap(decodePerformance(locale))
);

const decodeSponsors: Decoder<Array<Sponsor>> = decodeFilterMap(
  decodeSponsor(locale)
);

const reducer = (state: State = defaultState, action: DataAction) => {
  switch (action.type) {
    case "REQUEST_CMS_DATA":
      return {
        ...state,
        loading: true,
        refreshing: false
      };
    case "REQUEST_UPDATE_CMS_DATA":
      return {
        ...state,
        loading: false,
        refreshing: true
      };
    case "RECEIVE_CMS_DATA":
      return {
        loading: false,
        refreshing: false,
        events: resultWithDefault([], decodeEvents(action.data.entries)),
        featuredEvents: resultWithDefault(
          [],
          decodeFeaturedEventsCollection(action.data.entries)
        ),
        headerBanners: resultWithDefault(
          [],
          decodeHeaderBanners(action.data.entries)
        ),
        images: resultWithDefault({}, decodeImages(action.data.assets)),
        performances: resultWithDefault(
          {},
          decodePerformances(action.data.entries)
        ),
        sponsors: resultWithDefault([], decodeSponsors(action.data.entries))
      };
    case "RECEIVE_CMS_ERROR":
      return {
        ...state,
        loading: false,
        refreshing: false
      };
    default:
      return state;
  }
};
export default reducer;
