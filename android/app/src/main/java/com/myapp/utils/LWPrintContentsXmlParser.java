package com.myapp.utils;

/*
 * LWPrintContentsXmlParser.java
 *
 * Project: LW-Print SDK
 *
 * Contains: LWPrintContentsXmlParser class
 *
 * Copyright (C) 2013-2019 SEIKO EPSON CORPORATION. All Rights Reserved.
 */

import com.myapp.model.ContentsData;

import java.io.IOException;
import java.io.InputStream;
import java.net.MalformedURLException;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;

import org.xmlpull.v1.XmlPullParser;
import org.xmlpull.v1.XmlPullParserException;
import org.xmlpull.v1.XmlPullParserFactory;

public class LWPrintContentsXmlParser {

    private final String TAG = getClass().getSimpleName();
    private static final boolean DBG = false;

    private String kaigyo = System.getProperty("line.separator");

    // element
    private static String ROOT_ELEMENT = "dict";
    private static String KEY_ELEMENT = "key";

    public List<ContentsData> parse(InputStream is, String encoding)
            throws XmlPullParserException, IOException {
        try {
            XmlPullParserFactory factory = XmlPullParserFactory.newInstance();
            XmlPullParser parser = factory.newPullParser();
            parser.setInput(is, encoding);
            return readXml(parser);
        } finally {
        }
    }

    private List<ContentsData> readXml(XmlPullParser parser)
            throws XmlPullParserException, IOException {
        List<ContentsData> list = null;
        try {
            String name = "";
            String text = "";
            int eventType = parser.getEventType();
            while (eventType != XmlPullParser.END_DOCUMENT) {
                switch (eventType) {
                    case XmlPullParser.START_DOCUMENT:
                        if (DBG) {
//                            Logger.d(TAG, "START_DOCUMENT");
                        }
                        list = new ArrayList<ContentsData>();
                        break;
                    case XmlPullParser.START_TAG:
                        // get element and text value
                        name = parser.getName();
                        text = readText(parser);
                        text = text.replaceAll(kaigyo, "");

                        if (ROOT_ELEMENT.equals(name)) {
                            // parse element <dict>
                            list.add(readDictionary(parser));
                        }
                        break;
                    case XmlPullParser.END_TAG:
                        name = parser.getName();
                        if (DBG) {
//                            Logger.d(TAG, "END_TAG: " + "Name="
//                                    + name);
                        }
                        break;
                }
                eventType = parser.next();
            }
        } catch (MalformedURLException e) {
//            Logger.e(TAG, "", e);
        } catch (XmlPullParserException e) {
//            Logger.e(TAG, "", e);
        } catch (IOException e) {
//            Logger.e(TAG, "", e);
        }
        return list;
    }

    private ContentsData readDictionary(XmlPullParser parser)
            throws XmlPullParserException, IOException {
        HashMap<String, String> map = new HashMap<String, String>();
        ContentsData objData = new ContentsData();
        boolean keyFlag = false;
        String keyName = "";
        String keyValue = "";
        try {
            String name = "";
            String text = "";
            int eventType = parser.getEventType();
            while (eventType != XmlPullParser.END_DOCUMENT) {
                switch (eventType) {
                    case XmlPullParser.START_DOCUMENT:
                        if (DBG) {
//                            Logger.d(TAG, "START_DOCUMENT(dict)");
                        }
                        break;
                    case XmlPullParser.START_TAG:
                        // get element and text value
                        name = parser.getName();
                        text = readText(parser);
                        text = text.replaceAll(kaigyo, "");
                        if (keyFlag) {
                            if (KEY_ELEMENT.equals(name)) {
                                // not found value of element. Ex. <key> <key>
                                keyValue = "";
                            } else {
                                // value of element <key>. Ex. <sting> ... etc.
                                keyValue = text;
                            }
                            map.put(keyName, keyValue);
                            keyName = "";
                            keyValue = "";
                            keyFlag = false;
                        }
                        if (KEY_ELEMENT.equals(name)) {
                            // found element <key>
                            keyName = text;
                            keyValue = "";
                            keyFlag = true;
                        }
                        String sx = "";
                        sx = "Name=" + name;
                        sx += ", Text=" + text;
                        if (DBG) {
//                            Logger.d(TAG, "START_TAG(dict): " + sx);
                        }
                        break;
                    case XmlPullParser.END_TAG:
                        name = parser.getName();
                        if (DBG) {
//                            Logger.d(TAG, "END_TAG(dict): "
//                                    + "Name=" + name);
                        }
                        if (ROOT_ELEMENT.equalsIgnoreCase(name)) {
                            if (objData != null) {
                                objData.setElementMap(map);
                            }
                            return objData;
                        }
                        break;
                }
                eventType = parser.next();
            }
        } catch (MalformedURLException e) {
//            Logger.e(TAG, "", e);
        } catch (XmlPullParserException e) {
//            Logger.e(TAG, "", e);
        } catch (IOException e) {
//            Logger.e(TAG, "", e);
        }
        return objData;
    }

    private String readText(XmlPullParser parser) throws IOException,
            XmlPullParserException {
        String result = "";
        if (parser.next() == XmlPullParser.TEXT) {
            result = parser.getText();
        }
        return result;
    }

    private void skip(XmlPullParser parser) throws XmlPullParserException,
            IOException {
        if (parser.getEventType() != XmlPullParser.START_TAG) {
            throw new IllegalStateException();
        }
        int depth = 1;
        while (depth != 0) {
            switch (parser.next()) {
                case XmlPullParser.END_TAG:
                    depth--;
                    break;
                case XmlPullParser.START_TAG:
                    depth++;
                    break;
            }
        }
    }

}

