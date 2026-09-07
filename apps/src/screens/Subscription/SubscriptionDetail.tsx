import _ from "lodash";
import React, { useEffect, useState } from "react";
import { View, TouchableOpacity, Alert, StyleSheet, ImageBackground } from "react-native";
import { Divider } from 'react-native-elements';
import { Button, Container, Text} from "../../components";
import useApi from "../../hooks/useApi";
import Colors from "../../shared/Colors";
import Constants from "../../shared/Constants";
import i18n from "../../shared/I18n";
import { Fontisto,MaterialCommunityIcons } from "@expo/vector-icons";

export default function SubscriptionDetail(props: any) {

  const [listBooking, setListBooking] = useState([]);
  // const [loadingListBooking, requestListBooking] = useApi({
  //   method: "get",
  //   url: Constants.API.get_booking,
  //   callback: ({ error, response }) => {
  //     if (error) {
  //       Alert.alert(i18n.t("auth.error"), error);
  //       return;
  //     }

  //     if (!_.isNull(response)) {
  //       setListBooking(response && response.items);
  //     }
  //   },
  // });


  // useEffect(() => {
  // }, []);

  return (
    <Container>
      <View style={s.container}>
        <TouchableOpacity style={s.textBetween}>
          <Text style={s.textTitle}>{i18n.t('home.fix_plan')}</Text>
          <Fontisto name="angle-right" size={22} color={Colors.gray_normal_text} />
        </TouchableOpacity>
        <Divider style={{ backgroundColor: Colors.gray_hidden_text,height:2,marginHorizontal:30 }}/>
        <View style={s.textBetween}>
          <Text style={s.textTitle}>{i18n.t('home.fexible_plan')}</Text>
        </View>
        <ImageBackground imageStyle={{marginHorizontal:30,borderRadius:20}} style={s.image} source={require('../../assets/images/card_gold.png')}>
          <View style={{padding:20}}>
            <View style={{flexDirection:"row",justifyContent:"space-between",}}>
              <Text style={s.textBorder}>Silver </Text>
              <Text style={s.textBorder}> <MaterialCommunityIcons name="currency-btc" size={24} color="black" />651515 </Text>
            </View>
            <View>
              <Text>2221/month</Text>
              <Text>hfer egrgre dgd</Text>
              <Text>hrth trhfsg gdfsgrth</Text>
              <Text>hrthfb hrtjuy hgfdh</Text>
            </View>
            <View style={{alignItems:"flex-end"}}>
              <Button colorBackground={Colors.main_color} viewStyle={{borderRadius:20}} style={{width:100}} title={'Subscribe'}/>
            </View>
          </View>
        </ImageBackground>
        
      </View>
    </Container>
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1,
  },
  textBetween:{
    flexDirection:"row",
    justifyContent:"space-between",
    paddingHorizontal:30,
    paddingVertical:30
  },
  textTitle:{
    color:Colors.gray_normal_text,
    fontSize:25
  },
  textBorder:{
    fontWeight:"bold",
    fontSize:20
  },
  image:{
    width:"100%",
    height:200,
    paddingHorizontal:30,
  }
});
