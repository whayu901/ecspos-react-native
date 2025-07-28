// UploadToast/styles.ts
import {StyleSheet, Dimensions} from 'react-native';

const {width} = Dimensions.get('window');

const styles = StyleSheet.create({
  toastContainer: {
    position: 'absolute',
    top: 50,
    alignSelf: 'center',
    borderRadius: 8,
    zIndex: 9999,
    paddingHorizontal: 20,
    paddingVertical: 10,
    width: width - 40,
    elevation: 10,
  },
  textRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  toastText: {
    color: '#fff',
    fontSize: 14,
    flex: 1,
  },
  closeText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  progressContainer: {
    marginTop: 6,
    height: 4,
    backgroundColor: '#fff4',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBar: {
    height: 4,
    backgroundColor: '#fff',
  },
  percentText: {
    marginTop: 2,
    color: '#fff',
    fontSize: 12,
    textAlign: 'right',
  },
});

export default styles;
