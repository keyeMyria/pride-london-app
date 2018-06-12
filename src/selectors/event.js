// @flow
import R from "ramda";
import { compareAsc as compareDateAsc, isSameDay } from "../lib/date";
import type { Event } from "../data/event";

export const isFree = (priceLow: number, priceHigh: number) =>
  priceLow === 0 && priceHigh === 0;

// eslint-disable-next-line import/prefer-default-export
export const selectEventIsFree = (event: Event) =>
  isFree(event.fields.eventPriceLow, event.fields.eventPriceHigh);

const sortByStartTimeAsc = (a: Event, b: Event) =>
  compareDateAsc(a.fields.startTime, b.fields.startTime);

export const groupEventsByStartTime = (events: Event[]): EventDays =>
  R.groupWith(
    (a: Event, b: Event) => isSameDay(a.fields.startTime, b.fields.startTime),
    events.sort(sortByStartTimeAsc)
  );

export const filterEvents = (
  events: Event[],
  filter: Event => boolean
): Event[] => events.filter(filter);
