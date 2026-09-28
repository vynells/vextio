package com.vextio.disasters.util;

import java.util.Arrays;

/** Minimal growable primitive long list. */
public final class LongList {
    private long[] data = new long[1024];
    private int size;

    public void add(long v) {
        if (size == data.length) data = Arrays.copyOf(data, data.length * 2);
        data[size++] = v;
    }
    public long get(int i) { return data[i]; }
    public int size() { return size; }
    public boolean isEmpty() { return size == 0; }
    public long removeLast() { return data[--size]; }
    public void clear() { size = 0; }
}
