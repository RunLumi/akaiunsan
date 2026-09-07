import React, { useState, useEffect } from 'react';
import { Alert, Image, StyleSheet, View } from 'react-native';
import { useDispatch } from 'react-redux';
import { Button, Container, CustomInput } from '../../components';
import useApi from '../../hooks/useApi';
import Colors from '../../shared/Colors';
import Constants from '../../shared/Constants';
import i18n from '../../shared/I18n';
import Styles from '../../shared/Styles';

export default function ForgotPassword(props: any) {
	const [email, setEmail] = useState({value:"",isError:false,msgErr:""});
	const [otp, setOTP] = useState({value:"",isError:false,msgErr:""});
	const [pass, setPass] = useState({value:"",isError:false,msgErr:""});
	const [repass, setRePass] = useState({value:"",isError:false,msgErr:""});
	const [step, setStep] = useState(0);
	const [loadingOTP, requestOTP] = useApi({
		method: 'post',
		url: Constants.API.forgot_password,
		callback: ({ error, response }) => {
			if (error) Alert.alert(i18n.t('auth.error'), error);
			else {
				setStep(1);
			}
		},
	});
	const [loadingVerifyOTP, requestVerifyOTP] = useApi({
		method: 'post',
		url: Constants.API.check_otp,
		callback: ({ error, response }) => {
			if (error) Alert.alert(i18n.t('auth.error'), error);
			else {
				setStep(2);
			}
		},
	});
	const [loadingUpdatePass, requestUpdatePass] = useApi({
		method: 'put',
		url: Constants.API.reset_password,
		callback: ({ error, response }) => {
			if (error) Alert.alert(i18n.t('auth.error'), error);
			else {
				props.navigation.replace(Constants.SCREENS.AUTH.LOGIN, {
					email: email.value,
					password: pass.value,
				});
			}
		},
	});

	const validateEmail = (email:any) => {
		const re = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/;
		return re.test(email);
	  };

	const onPressNext = () => {
		switch (step) {
			case 0:
				if (!email.value) {
					setEmail({
						...email,
						isError:true,
						msgErr:i18n.t('auth.missing_email_otp')
					});
					return;
				}
				if (email.value && !validateEmail(email.value)) {
					setEmail({
						...email,
						isError:true,
						msgErr:i18n.t('auth.validate_email_otp')
					});
					return;
				}
				requestOTP({ data: { email: email.value } });
				break;
			case 1:
				if (!otp.value) {
					setOTP({
						...otp,
						isError:true,
						msgErr:i18n.t('auth.missing_otp')
					});
					return;
				}
				requestVerifyOTP({ data: { email: email.value, otp: otp.value } });
				break;
			case 2:
				if (!pass.value) {
					setPass({
						...pass,
						isError:true,
						msgErr:i18n.t('auth.missing_password')
					});
					return;
				}
				if (pass.value &&
					/^(?=.*\d)(?=.*[a-z])[0-9a-zA-Z]{8,}$/.test(pass.value) ===
				false) {
					setPass({
						...pass,
						isError:true,
						msgErr:i18n.t('auth.validate_password')
					});
					return;
				}
				if (!repass.value) {
					setRePass({
						...repass,
						isError:true,
						msgErr:i18n.t('auth.missing_re_password')
					});
					return;
				}
				if (pass.value !== repass.value) {
					setRePass({
						...repass,
						isError:true,
						msgErr:i18n.t('auth.error_confirm')
					});
					return;
				}
				requestUpdatePass({ data: { newPassword: pass.value, email: email.value,otp: otp.value } });
				break;
		}
	};

	if (step === 2) {
		return (
			<Container style={s.container}>
				<View
					style={{
						justifyContent: 'center',
						alignItems: 'center',
						height: '33%',
					}}
				>
					<Image
						source={require('../../assets/images/akaiunsan_logo.png')}
						style={s.logo}
					/>
				</View>
				<View style={[s.content, { flex: 1 }]}>
					<CustomInput
						value={pass.value}
						onChangeText={(value)=>setPass({...pass,value,isError:false})}
						placeholder={i18n.t('auth.password')}
						style={{ fontStyle: 'italic' }}
						secureText={true}
						isError={pass.isError}
						errorText={pass.msgErr}
					/>
					<CustomInput
						containerStyle={{ marginTop: 20 }}
						value={repass.value}
						onChangeText={(value) => setRePass({...repass,isError:false,value})}
						placeholder={i18n.t('auth.repassword')}
						style={{ fontStyle: 'italic' }}
						secureText={true}
						isError={repass.isError}
						errorText={repass.msgErr}
					/>
					<Button
						onPress={onPressNext}
						style={{ width: '100%', marginTop: 20 }}
						title={i18n.t('auth.sign_in')}
						loading={loadingUpdatePass}
					/>
						<Button
						onPress={() => setStep(1)}
						style={{ width: '100%', marginTop: -4 }}
						title={i18n.t('home.back')}
						loading={loadingUpdatePass}
					/>
				</View>
			</Container>
		);
	}

	if (step === 1) {
		return (
			<Container style={s.container}>
				<View
					style={{
						justifyContent: 'center',
						alignItems: 'center',
						height: '33%',
					}}
				>
					<Image
						source={require('../../assets/images/akaiunsan_logo.png')}
						style={s.logo}
					/>
				</View>
				<View style={[s.content, { flex: 1 }]}>
					<CustomInput
						keyboardType="number-pad"
						value={otp.value}
						onChangeText={(value) => setOTP({...otp,value,isError:false})}
						placeholder={i18n.t('auth.otp')}
						style={{ fontStyle: 'italic' }}
						isError={otp.isError}
						errorText={otp.msgErr}
					/>
					<Button
						onPress={onPressNext}
						style={{ width: '100%', marginTop: 20 }}
						title={i18n.t('auth.confirm')}
						loading={loadingVerifyOTP}
					/>
						<Button
						onPress={() => setStep(0)}
						style={{ width: '100%', marginTop: -4 }}
						title={i18n.t('home.back')}
						loading={loadingUpdatePass}
					/>
				</View>
			</Container>
		);
	}

	return (
		<Container style={s.container} statusBarColor={Colors.white}>
			<View style={{ flex: 1, height: '100%' }}>
				<View
					style={{
						justifyContent: 'center',
						alignItems: 'center',
						height: '33%',
					}}
				>
					<Image
						source={require('../../assets/images/akaiunsan_logo.png')}
						style={s.logo}
					/>
				</View>
				<View style={[s.content]}>
					<CustomInput
						value={email.value}
						keyboardType="email-address"
						onChangeText={(value)=>setEmail({...email,value,isError:false})}
						isError={email.isError}
						errorText={email.msgErr}
						placeholder={i18n.t('auth.email')}
						style={{ fontStyle: 'italic' }}
					/>
					<Button
						onPress={onPressNext}
						style={{ width: '100%', marginTop: 20 }}
						title={i18n.t('auth.send_otp')}
						loading={loadingOTP}
					/>
				</View>
			</View>
		</Container>
	);
}

const s = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: Colors.white,
	},
	login: {
		alignSelf: 'flex-end',
		marginTop: 30,
		marginRight: Styles.margin.horizontal,
		color: Colors.blue_link,
		fontStyle: 'italic',
		textDecorationLine: 'underline',
	},
	login2: {
		alignSelf: 'center',
		marginTop: 10,
		color: Colors.blue_link,
		textDecorationLine: 'underline',
	},
	title: {
		marginTop: 15,
		marginBottom: 5,
		color: Colors.gray,
	},
	logo: {
		resizeMode: 'contain',
		alignSelf: 'center',
		marginTop: 20,
		marginBottom: 20,
		height: 100,
	},
	content: {
		marginHorizontal: Styles.margin.horizontal,
	},
	logoContainer: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
	},
	forgot: {
		alignSelf: 'flex-end',
		color: Colors.blue_link,
	},
	or: {
		paddingTop: 30,
		alignSelf: 'center',
		flex: 1,
	},
	loginWith: {
		alignSelf: 'center',
		fontSize: Styles.typography.footnode,
		marginBottom: 10,
	},
	row: {
		flexDirection: 'row',
		alignSelf: 'center',
	},
	socialBtn: {
		marginHorizontal: Styles.margin.horizontal,
	},
	signupDes: {
		alignSelf: 'center',
		marginTop: 50,
		paddingBottom: 30,
	},
	signup: {
		color: Colors.blue_link,
	},
});
